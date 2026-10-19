import { Request, Response, Router } from "express";
import { TicketStatus, statuses } from "../contracts/ticket";
import { store } from "../db/store";
import { canTransition } from "../tickets/machine";

export const ticketsRouter = Router();

let emitSocketEvent: ((event: string, data: any) => void) | null = null;
export function setTicketsSocketEmitter(emitter: (event: string, data: any) => void) {
  emitSocketEvent = emitter;
}

/**
 * GET /api/tickets
 * Lấy danh sách phiếu xử lý sự cố (hỗ trợ lọc theo zone_code, status)
 * Định dạng trả về: { items: Ticket[] } chuẩn hợp đồng bàn giao cho dashboard C
 */
ticketsRouter.get("/", (req: Request, res: Response) => {
  const zoneCode = req.query.zone_code as string | undefined;
  const status = req.query.status as string | undefined;

  let items = store.getTickets({
    zone_code: zoneCode,
    status: status,
  });

  const now = Date.now();
  const processed = items.map((t) => {
    const isOverdue =
      Boolean(t.due_at) &&
      new Date(t.due_at!).getTime() < now &&
      ["received", "assigned", "verifying"].includes(t.status);
    return {
      ...t,
      is_overdue: isOverdue,
      escalated: isOverdue,
    };
  });

  return res.json({ items: processed });
});

/**
 * GET /api/tickets/overdue
 * Lấy danh sách các phiếu quá hạn xử lý SLA (cần Ban Quản lý can thiệp khẩn cấp)
 */
ticketsRouter.get("/overdue", (_req: Request, res: Response) => {
  const allTickets = store.getTickets();
  const now = Date.now();

  const overdueItems = allTickets
    .filter(
      (t) =>
        Boolean(t.due_at) &&
        new Date(t.due_at!).getTime() < now &&
        ["received", "assigned", "verifying"].includes(t.status)
    )
    .map((t) => ({ ...t, is_overdue: true, escalated: true }));

  return res.json({
    count: overdueItems.length,
    items: overdueItems,
  });
});

/**
 * GET /api/tickets/:code
 * Chi tiết phiếu kèm lịch sử xử lý 6 bước
 */
ticketsRouter.get("/:code", (req: Request, res: Response) => {
  const code = req.params.code;
  const ticket = store.getTicket(code);

  if (!ticket) {
    return res.status(404).json({ error: "Không tìm thấy phiếu" });
  }

  const history = store.getHistory(code);
  const zone = store.getZone(ticket.zone_code);

  return res.json({
    ticket,
    zone,
    history,
  });
});

/**
 * PATCH /api/tickets/:code/status
 * Cập nhật trạng thái phiếu tuân theo máy trạng thái 6 bước
 */
ticketsRouter.patch("/:code/status", (req: Request, res: Response) => {
  const code = req.params.code;
  const { status: nextStatus, note, assignee_id } = req.body || {};

  const ticket = store.getTicket(code);
  if (!ticket) {
    return res.status(404).json({ error: "Không tìm thấy phiếu" });
  }

  if (!nextStatus || !statuses.includes(nextStatus)) {
    return res.status(400).json({ error: "Trạng thái mới không hợp lệ" });
  }

  // Kiểm tra chuyển trạng thái hợp lệ
  if (!canTransition(ticket.status, nextStatus as TicketStatus)) {
    return res.status(400).json({
      error: `Không thể chuyển trực tiếp từ trạng thái '${ticket.status}' sang '${nextStatus}'`,
    });
  }

  const prevStatus = ticket.status;
  ticket.status = nextStatus as TicketStatus;
  ticket.updated_at = new Date().toISOString();

  if (assignee_id) {
    ticket.assignee_id = assignee_id;
  }
  if (note) {
    ticket.feedback_note = note;
  }

  store.saveTicket(ticket);

  // Ghi nhận lịch sử audit log
  store.addHistory({
    id: `hist_${ticket.code}_${Date.now()}`,
    ticket_code: ticket.code,
    from_status: prevStatus,
    to_status: nextStatus,
    action: "status_change",
    performed_by_id: assignee_id || (req as any).user?.id || null,
    performed_by_name: (req as any).user?.name || "Ca trực An ninh ĐHQGHN",
    note: note || `Chuyển trạng thái từ ${prevStatus} sang ${nextStatus}`,
    created_at: ticket.updated_at,
  });

  if (emitSocketEvent) {
    emitSocketEvent("ticket:updated", ticket);
  }

  return res.json({
    ok: true,
    ticket,
  });
});
