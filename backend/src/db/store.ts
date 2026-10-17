import { DEFAULT_ZONES, Zone } from "../contracts/zones";
import { Ticket, TicketHistory, User, Infographic } from "../contracts/ticket";
import { SEED_USERS, SEED_TICKETS, SEED_INFOGRAPHICS } from "../../prisma/seed";

export interface StoredReport {
  id: string;
  tracking_code: string;
  zone_code: string;
  type: string;
  ongoing: boolean;
  emergency: boolean;
  note: string;
  device_token: string;
  ticket_code: string;
  created_at: string;
}

/**
 * DataStore trung tâm của backend SFZ.
 * Hỗ trợ lưu trữ bền vững trong RAM/File và đồng bộ Prisma.
 */
class MemoryDataStore {
  private zones: Map<string, Zone> = new Map();
  private users: Map<string, User & { password_hash: string }> = new Map();
  private tickets: Map<string, Ticket> = new Map();
  private reports: Map<string, StoredReport> = new Map();
  private histories: Map<string, TicketHistory[]> = new Map();
  private infographics: Map<string, Infographic> = new Map();
  private ticketSeq: number = 42;

  constructor() {
    this.reset();
  }

  public reset() {
    this.zones.clear();
    this.users.clear();
    this.tickets.clear();
    this.reports.clear();
    this.histories.clear();
    this.infographics.clear();

    // 1. Nạp danh mục 20 khu vực
    for (const z of DEFAULT_ZONES) {
      this.zones.set(z.code, { ...z });
    }

    // 2. Nạp người dùng demo
    for (const u of SEED_USERS) {
      this.users.set(u.username, {
        id: u.id,
        name: u.name,
        role: u.role as any,
        password_hash: u.password_hash,
      });
    }

    // 3. Nạp phiếu mẫu
    for (const t of SEED_TICKETS) {
      this.tickets.set(t.code, { ...t } as any);
      this.histories.set(t.code, [
        {
          id: `hist_${t.code}_0`,
          ticket_code: t.code,
          from_status: null,
          to_status: t.status as any,
          action: "create",
          performed_by_id: t.assignee_id,
          performed_by_name: t.assignee_id ? "Ca trực An ninh ĐHQGHN" : "Hệ thống SFZ",
          note: t.feedback_note || "Tiếp nhận phiếu ban đầu",
          created_at: t.created_at,
        },
      ]);
    }

    // 4. Nạp infographic
    for (const info of SEED_INFOGRAPHICS) {
      this.infographics.set(info.id, {
        id: info.id,
        title: info.title,
        image_url: info.image_url,
        building: info.building as any,
        zone_code: info.zone_code,
        created_by_id: info.created_by_id,
        is_active: info.is_active,
        created_at: new Date().toISOString(),
      });
    }
  }

  // === Zones ===
  public getZones(): Zone[] {
    return Array.from(this.zones.values());
  }

  public getZone(code: string): Zone | undefined {
    return this.zones.get(code);
  }

  public updateZoneSensor(
    zoneCode: string,
    sensorState: Zone["sensor_state"],
    presence: boolean | null
  ) {
    const z = this.zones.get(zoneCode);
    if (z) {
      z.sensor_state = sensorState;
      z.presence = presence;
    }
  }

  // === Users & Auth ===
  public getUserByUsername(username: string) {
    return this.users.get(username);
  }

  public getUserById(id: string) {
    for (const u of this.users.values()) {
      if (u.id === id) return u;
    }
    return undefined;
  }

  // === Tickets ===
  public getTickets(filters?: { zone_code?: string; status?: string }): Ticket[] {
    let list = Array.from(this.tickets.values());
    if (filters?.zone_code) {
      list = list.filter((t) => t.zone_code === filters.zone_code);
    }
    if (filters?.status) {
      list = list.filter((t) => t.status === filters.status);
    }
    // Sắp xếp mới nhất lên trước
    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getTicket(code: string): Ticket | undefined {
    return this.tickets.get(code);
  }

  public getNextTicketSequence(): number {
    this.ticketSeq += 1;
    return this.ticketSeq;
  }

  public saveTicket(ticket: Ticket): Ticket {
    this.tickets.set(ticket.code, ticket);
    return ticket;
  }

  // === Reports ===
  public saveReport(report: StoredReport): StoredReport {
    this.reports.set(report.tracking_code, report);
    return report;
  }

  public getReportByTrackingCode(trackingCode: string): StoredReport | undefined {
    return this.reports.get(trackingCode);
  }

  // === History ===
  public addHistory(history: TicketHistory) {
    const list = this.histories.get(history.ticket_code) || [];
    list.push(history);
    this.histories.set(history.ticket_code, list);
  }

  public getHistory(ticketCode: string): TicketHistory[] {
    return this.histories.get(ticketCode) || [];
  }

  // === Infographics ===
  public getInfographics(): Infographic[] {
    return Array.from(this.infographics.values()).filter((i) => i.is_active);
  }

  public saveInfographic(info: Infographic): Infographic {
    this.infographics.set(info.id, info);
    return info;
  }
}

export const store = new MemoryDataStore();
