import { Request, Response, Router } from "express";
import { reportSchema, reportTypeLabels, ReportType } from "../contracts/report";
import { statusLabels, Ticket } from "../contracts/ticket";
import { store } from "../db/store";
import {
  sanitizeNote,
  generateTrackingCode,
  generateTicketCode,
} from "../tickets/sanitizer";
import {
  calculateSLA,
  shouldMergeReport,
  resolveMergedSourceAndPriority,
} from "../tickets/machine";

export const reportsRouter = Router();

// Hook phát sự kiện realtime qua Socket.IO
let emitSocketEvent: ((event: string, data: any) => void) | null = null;
export function setReportsSocketEmitter(emitter: (event: string, data: any) => void) {
  emitSocketEvent = emitter;
}

/**
 * POST /api/reports
 * Tiếp nhận phản ánh từ Sinh viên
 */
reportsRouter.post("/", (req: Request, res: Response) => {
  const parseResult = reportSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Dữ liệu phản ánh không hợp lệ",
      details: parseResult.error.errors,
    });
  }

  const data = parseResult.data;

  // Kiểm tra khu vực có tồn tại không
  const zone = store.getZone(data.zone_code);
  if (!zone) {
    return res.status(400).json({
      error: `Mã khu vực '${data.zone_code}' không tồn tại trong danh mục`,
    });
  }

  // 1. Che thông tin định danh bằng quy tắc regex
  const cleanedNote = sanitizeNote(data.note);

  // 2. Cấp mã tra cứu ngẫu nhiên
  const trackingCode = generateTrackingCode();

  // 3. Kiểm tra gộp nguồn: tìm phiếu đang mở cùng khu vực trong vòng 15 phút
  const existingTickets = store.getTickets({ zone_code: data.zone_code });
  let targetTicket: Ticket | undefined = undefined;

  for (const t of existingTickets) {
    if (shouldMergeReport(t, data.zone_code, 15)) {
      targetTicket = t;
      break;
    }
  }

  const nowIso = new Date().toISOString();

  if (targetTicket) {
    // Gộp nguồn vào phiếu hiện tại
    const { source: newSource, priority: newPriority } =
      resolveMergedSourceAndPriority(
        targetTicket.source,
        targetTicket.priority,
        data.emergency ? "emergency" : "report",
        data.emergency
      );

    targetTicket.source = newSource;
    targetTicket.priority = newPriority;
    targetTicket.updated_at = nowIso;
    store.saveTicket(targetTicket);

    store.addHistory({
      id: `hist_${targetTicket.code}_${Date.now()}`,
      ticket_code: targetTicket.code,
      from_status: targetTicket.status,
      to_status: targetTicket.status,
      action: "merge_report",
      performed_by_id: null,
      performed_by_name: "Sinh viên (quét QR)",
      note: `Gộp phản ánh mới [${trackingCode}]: ${reportTypeLabels[data.type] || data.type}. Ghi chú: ${cleanedNote || "Không có"}`,
      created_at: nowIso,
    });

    if (emitSocketEvent) {
      emitSocketEvent("ticket:updated", targetTicket);
    }
  } else {
    // Tạo phiếu mới
    const seq = store.getNextTicketSequence();
    const ticketCode = generateTicketCode(seq);

    const initialPriority = data.emergency ? "urgent" : "normal";
    const initialSource = data.emergency ? "emergency" : "report";
    const { dueAt } = calculateSLA(initialPriority);
    const isTrial = Boolean(data.is_trial || data.source === "form2_trial");

    targetTicket = {
      code: ticketCode,
      zone_code: data.zone_code,
      source: initialSource,
      priority: initialPriority,
      status: "received",
      created_at: nowIso,
      updated_at: nowIso,
      due_at: dueAt.toISOString(),
      assignee_id: null,
      presence: zone.presence,
      feedback_note: null,
      is_trial: isTrial,
      is_sandbox: false,
    };

    store.saveTicket(targetTicket);

    store.addHistory({
      id: `hist_${targetTicket.code}_0`,
      ticket_code: targetTicket.code,
      from_status: null,
      to_status: "received",
      action: "create",
      performed_by_id: null,
      performed_by_name: isTrial ? "Sinh viên (thử nghiệm Form 2)" : "Sinh viên (quét QR)",
      note: `Tạo phiếu từ phản ánh [${trackingCode}]: ${reportTypeLabels[data.type] || data.type}.${isTrial ? " [NGUỒN THỬ NGHIỆM FORM 2]" : ""} Ghi chú: ${cleanedNote || "Không có"}`,
      created_at: nowIso,
    });

    if (emitSocketEvent) {
      emitSocketEvent("ticket:created", targetTicket);
    }
  }

  // 4. Lưu bản ghi phản ánh
  const isTrial = Boolean(data.is_trial || data.source === "form2_trial");
  store.saveReport({
    id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tracking_code: trackingCode,
    zone_code: data.zone_code,
    type: data.type,
    ongoing: data.ongoing,
    emergency: data.emergency,
    note: cleanedNote,
    device_token: data.device_token,
    ticket_code: targetTicket.code,
    source: data.source || "qr_app",
    is_trial: isTrial,
    is_sandbox: false,
    created_at: nowIso,
  } as any);

  return res.status(201).json({
    tracking_code: trackingCode,
    status: targetTicket.status,
    ticket_code: targetTicket.code,
    message: "Phản ánh đã được tiếp nhận thành công",
  });
});

/**
 * GET /api/reports/track/:code
 * Tra cứu tiến độ phản ánh qua mã tra cứu ngẫu nhiên
 */
reportsRouter.get("/track/:code", (req: Request, res: Response) => {
  const code = req.params.code?.trim().toUpperCase();
  if (!code) {
    return res.status(400).json({ error: "Thiếu mã tra cứu" });
  }

  const report = store.getReportByTrackingCode(code);
  if (!report) {
    return res.status(404).json({ error: "Không tìm thấy phản ánh với mã tra cứu này" });
  }

  const zone = store.getZone(report.zone_code);
  const ticket = store.getTicket(report.ticket_code);

  const status = ticket ? ticket.status : "received";
  const statusLabel = statusLabels[status] || status;

  let feedback = ticket?.feedback_note || null;
  if (!feedback) {
    if (status === "received") {
      feedback = "Hệ thống đã tiếp nhận phản ánh và đang điều phối lực lượng ca trực.";
    } else if (status === "assigned" || status === "verifying") {
      feedback = "Ca trực đang trên đường đến hiện trường để kiểm tra, xử lý.";
    } else if (status === "handled" || status === "responded" || status === "closed") {
      feedback = "Cảm ơn bạn đã đồng hành giữ gìn không gian không khói thuốc tại KTX ĐHQGHN.";
    }
  }

  return res.json({
    tracking_code: report.tracking_code,
    zone_code: report.zone_code,
    zone_name: zone?.name || report.zone_code,
    building: zone?.building || "",
    floor: zone?.floor || 1,
    type: report.type,
    type_label: reportTypeLabels[report.type as ReportType] || report.type,
    status,
    status_label: statusLabel,
    created_at: report.created_at,
    updated_at: ticket ? ticket.updated_at : report.created_at,
    feedback,
  });
});

// Cho phép tra cứu qua alias GET /api/reports/:code
reportsRouter.get("/:code", (req: Request, res: Response) => {
  return (reportsRouter as any).handle(
    { ...req, url: `/track/${req.params.code}`, params: { code: req.params.code } },
    res
  );
});
