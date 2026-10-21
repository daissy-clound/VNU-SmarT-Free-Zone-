import { Telemetry, telemetrySchema } from "../contracts/telemetry";
import { Ticket, Event } from "../contracts/ticket";
import { store } from "../db/store";
import { generateTicketCode } from "../tickets/sanitizer";
import {
  calculateSLA,
  shouldMergeReport,
  resolveMergedSourceAndPriority,
} from "../tickets/machine";
import { notificationService } from "../notify/webpush";

// Ngưỡng phát hiện khói bất thường (Tầng 1 v0)
const SMOKE_PM25_THRESHOLD = 35.0; // ug/m3
const BASELINE_DELTA_THRESHOLD = 20.0; // Tăng vọt so với mức nền

interface MinuteSummary {
  node_id: string;
  minute_timestamp: string;
  count: number;
  avg_pm25: number;
  max_pm25: number;
  avg_temp: number;
  avg_rh: number;
  presence_detections: number;
}

class TelemetryIngestService {
  private recentTelemetries: Map<string, Telemetry[]> = new Map();
  private minuteSummaries: Map<string, MinuteSummary[]> = new Map();
  private emitSocket: ((event: string, data: any) => void) | null = null;

  public setSocketEmitter(emitter: (event: string, data: any) => void) {
    this.emitSocket = emitter;
  }

  /**
   * Xử lý bản tin cảm biến (nhận từ MQTT hoặc từ kịch bản giả lập Wokwi)
   */
  public async processTelemetry(raw: unknown): Promise<{
    status: "normal" | "anomaly_detected" | "invalid";
    ticket?: Ticket;
    event?: Event;
    error?: string;
  }> {
    const parsed = telemetrySchema.safeParse(raw);
    if (!parsed.success) {
      return { status: "invalid", error: parsed.error.message };
    }

    const t = parsed.data;

    // 1. Cập nhật trạng thái nút và khu vực
    const zone = store.getZone(t.node_id);
    if (zone) {
      store.updateZoneSensor(
        t.node_id,
        t.pm25 > SMOKE_PM25_THRESHOLD ? "suspected" : "normal",
        t.presence
      );
      if (this.emitSocket) {
        this.emitSocket("zone:updated", store.getZone(t.node_id));
      }
    }

    // 2. Lưu lịch sử ngắn và tính tóm tắt mỗi phút
    this.recordMinuteSummary(t);

    // 3. Kiểm tra bất thường khói thuốc
    const isAnomaly = this.detectSmokeAnomaly(t);

    if (isAnomaly) {
      console.log(
        `🚨 [Ingest Anomaly] Phát hiện khói bất thường tại ${t.node_id}: PM2.5=${t.pm25} ug/m3, PIR=${t.presence}`
      );

      // Mở hoặc gộp phiếu
      const { ticket, event } = await this.handleAnomalyTicket(t);

      // Gửi cảnh báo Web Push tới ca trực trong vòng 5 giây
      const presenceStatus =
        t.presence === true
          ? "present"
          : t.presence === false
          ? "absent"
          : "unknown";

      await notificationService.notifyGuards(
        {
          title: "CẢNH BÁO KHÓI THUỐC PHÁT HIỆN QUA CẢM BIẾN",
          body: `Chỉ số PM2.5 đạt ${t.pm25.toFixed(1)} ug/m3 tại ${t.node_id}`,
          zone_code: t.node_id,
          presence_status: presenceStatus,
          priority: ticket.priority,
          ticket_code: ticket.code,
          timestamp: new Date().toISOString(),
        },
        this.emitSocket || undefined
      );

      return { status: "anomaly_detected", ticket, event };
    }

    return { status: "normal" };
  }

  /**
   * Bộ lọc phát hiện khói bất thường (Tầng 1 cơ bản theo phân công Mốc 1)
   */
  private detectSmokeAnomaly(t: Telemetry): boolean {
    // 1. Lọc hơi nước nhà tắm: nếu độ ẩm > 85% và hạt to chiếm ưu thế thì không coi là khói thuốc điếu
    if (t.rh > 85 && t.typ_size > 1.2) {
      return false;
    }

    // 2. Vượt ngưỡng PM2.5 tuyệt đối
    if (t.pm25 >= SMOKE_PM25_THRESHOLD) {
      return true;
    }

    // 3. Tăng vọt đột ngột so với mức trung bình 5 bản tin gần nhất
    const history = this.recentTelemetries.get(t.node_id) || [];
    if (history.length >= 3) {
      const avgRecent =
        history.slice(-3).reduce((acc, cur) => acc + cur.pm25, 0) / 3;
      if (t.pm25 - avgRecent >= BASELINE_DELTA_THRESHOLD) {
        return true;
      }
    }

    return false;
  }

  /**
   * Tạo sự kiện và mở/gộp phiếu xử lý
   */
  private async handleAnomalyTicket(
    t: Telemetry
  ): Promise<{ ticket: Ticket; event: Event }> {
    const existingTickets = store.getTickets({ zone_code: t.node_id });
    let targetTicket: Ticket | undefined;

    for (const ticket of existingTickets) {
      if (shouldMergeReport(ticket, t.node_id, 15)) {
        targetTicket = ticket;
        break;
      }
    }

    const nowIso = new Date().toISOString();
    const eventId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Tạo bản ghi sự kiện khói nghi vấn
    const eventRecord: Event = {
      event_id: eventId,
      source: "sensor",
      zone_code: t.node_id,
      started_at: nowIso,
      ended_at: null,
      class: "unclassified", // Tầng 1 gắn nhãn nghi vấn, tầng 2 sẽ phân loại chi tiết
      confidence: t.presence ? 0.92 : 0.82,
      ticket_code: "",
    };

    if (targetTicket) {
      // Gộp vào phiếu hiện tại
      const { source: newSource, priority: newPriority } =
        resolveMergedSourceAndPriority(
          targetTicket.source,
          targetTicket.priority,
          "sensor",
          false
        );

      targetTicket.source = newSource;
      targetTicket.priority = newPriority;
      targetTicket.presence = t.presence ?? targetTicket.presence;
      targetTicket.updated_at = nowIso;
      eventRecord.ticket_code = targetTicket.code;

      store.saveTicket(targetTicket);

      store.addHistory({
        id: `hist_${targetTicket.code}_${Date.now()}`,
        ticket_code: targetTicket.code,
        from_status: targetTicket.status,
        to_status: targetTicket.status,
        action: "merge_sensor",
        performed_by_id: null,
        performed_by_name: `Cảm biến IoT (${t.node_id})`,
        note: `Bản tin cảm biến phát hiện khói (PM2.5=${t.pm25} ug/m3, PIR=${t.presence ? "Có người" : "Không"})`,
        created_at: nowIso,
      });

      if (this.emitSocket) {
        this.emitSocket("ticket:updated", targetTicket);
      }

      return { ticket: targetTicket, event: eventRecord };
    } else {
      // Tạo phiếu mới
      const seq = store.getNextTicketSequence();
      const ticketCode = generateTicketCode(seq);
      const priority = t.presence ? "urgent" : "high";
      const { dueAt } = calculateSLA(priority);

      targetTicket = {
        code: ticketCode,
        zone_code: t.node_id,
        source: "sensor",
        priority: priority,
        status: "received",
        created_at: nowIso,
        updated_at: nowIso,
        due_at: dueAt.toISOString(),
        assignee_id: null,
        presence: t.presence,
        feedback_note: null,
      };

      eventRecord.ticket_code = targetTicket.code;
      store.saveTicket(targetTicket);

      store.addHistory({
        id: `hist_${targetTicket.code}_0`,
        ticket_code: targetTicket.code,
        from_status: null,
        to_status: "received",
        action: "create_sensor",
        performed_by_id: null,
        performed_by_name: `Cảm biến IoT (${t.node_id})`,
        note: `Tự động mở phiếu do PM2.5 vượt ngưỡng (${t.pm25} ug/m3, PIR=${t.presence ? "Có người" : "Không"})`,
        created_at: nowIso,
      });

      if (this.emitSocket) {
        this.emitSocket("ticket:created", targetTicket);
      }

      return { ticket: targetTicket, event: eventRecord };
    }
  }

  /**
   * Lưu tóm tắt 1 phút
   */
  private recordMinuteSummary(t: Telemetry) {
    const list = this.recentTelemetries.get(t.node_id) || [];
    list.push(t);
    // Giữ tối đa 12 điểm (tương đương 60 giây ở tần suất 5s/điểm)
    if (list.length > 12) list.shift();
    this.recentTelemetries.set(t.node_id, list);
  }

  public getRecentTelemetries(nodeId: string): Telemetry[] {
    return this.recentTelemetries.get(nodeId) || [];
  }
}

export const telemetryIngestService = new TelemetryIngestService();
