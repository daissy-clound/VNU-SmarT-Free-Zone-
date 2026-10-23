import { Request, Response, Router } from "express";
import { TicketStatus, statuses } from "../contracts/ticket";
import { store } from "../db/store";
import { canTransition } from "../tickets/machine";
import { optionalAuth } from "./auth";
import { dispatchService } from "../dispatch/service";

export const ticketsRouter = Router();

let emitSocketEvent: ((event: string, data: any) => void) | null = null;
export function setTicketsSocketEmitter(emitter: (event: string, data: any) => void) {
  emitSocketEvent = emitter;
}

/**
 * GET /api/tickets
 * Lấy danh sách phiếu xử lý sự cố có phân quyền theo vai trò:
 * - guard (phòng trực): chỉ thấy phiếu BQL đã điều phối cho phòng mình (chưa ai nhận) hoặc phiếu mình đã nhận; ẩn sandbox
 * - viewer (BGK): thấy phiếu mẫu và phiếu sandbox
 * - manager / analyst: thấy toàn bộ phiếu vận hành
 */
ticketsRouter.get("/", optionalAuth, (req: Request, res: Response) => {
  const zoneCode = req.query.zone_code as string | undefined;
  const status = req.query.status as string | undefined;
  const isTrialQuery = req.query.is_trial as string | undefined;
  const isSandboxQuery = req.query.is_sandbox as string | undefined;
  const user = (req as any).user;

  let items = store.getTickets({
    zone_code: zoneCode,
    status: status,
  });

  // 1. Phân quyền vai trò
  if (user?.role === "guard") {
    // Phòng trực: chỉ thấy phiếu Ban quản lý đã điều phối cho phòng mình, hoặc phiếu mình đã nhận
    items = items.filter((t) => !t.is_sandbox && dispatchService.visibleToGuard(t, user.id));
  } else if (user?.role === "viewer") {
    // BGK: thấy phiếu mẫu + phiếu sandbox của BGK
    items = items.filter((t) => t.is_sandbox || !t.is_trial);
  } else if (!isSandboxQuery) {
    // Mặc định ẩn phiếu sandbox đối với BQL để không làm loãng số liệu chính
    items = items.filter((t) => !t.is_sandbox);
  }

  // 2. Bộ lọc phụ trợ
  if (isTrialQuery !== undefined) {
    const isTrial = isTrialQuery === "true";
    items = items.filter((t) => Boolean(t.is_trial) === isTrial);
  }

  if (isSandboxQuery !== undefined) {
    const isSandbox = isSandboxQuery === "true";
    items = items.filter((t) => Boolean(t.is_sandbox) === isSandbox);
  }

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
      is_sandbox: Boolean(t.is_sandbox),
      is_trial: Boolean(t.is_trial),
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
 * Cập nhật trạng thái phiếu tuân theo máy trạng thái 6 bước và kiểm soát thẩm quyền:
 * - viewer (BGK): chỉ được sửa phiếu sandbox
 * - analyst: chỉ đọc (Forbidden)
 * - guard (Ca trực): chỉ được cập nhật verifying, handled
 * - manager (BQL): toàn quyền
 */
ticketsRouter.patch("/:code/status", optionalAuth, (req: Request, res: Response) => {
  const code = req.params.code;
  const { status: nextStatus, note, assignee_id } = req.body || {};
  const user = (req as any).user;

  const ticket = store.getTicket(code);
  if (!ticket) {
    return res.status(404).json({ error: "Không tìm thấy phiếu" });
  }

  // 1. Kiểm soát phân quyền
  if (user) {
    if (user.role === "viewer" && !ticket.is_sandbox) {
      return res.status(403).json({
        error: "Từ chối: Ban Giám Khảo chỉ có thể thao tác trên phiếu thử nghiệm (Sandbox), không được sửa phiếu thật",
      });
    }

    if (user.role === "analyst") {
      return res.status(403).json({
        error: "Từ chối: Vai trò Phân tích chỉ có quyền đọc (Read-only), không được chuyển trạng thái phiếu",
      });
    }

    if (user.role === "guard") {
      if (!dispatchService.visibleToGuard(ticket, user.id)) {
        return res.status(403).json({
          error: "Từ chối: phiếu chưa được Ban quản lý điều phối cho phòng trực của bạn, hoặc đã có cán bộ khác nhận",
        });
      }
      if (["responded", "closed"].includes(nextStatus)) {
        return res.status(403).json({
          error: "Từ chối: Thao tác phê duyệt phản hồi (responded) hoặc đóng phiếu (closed) thuộc thẩm quyền của Ban Quản lý",
        });
      }
    }
  }

  if (!nextStatus || !statuses.includes(nextStatus)) {
    return res.status(400).json({ error: "Trạng thái mới không hợp lệ" });
  }

  // 2. Kiểm tra chuyển trạng thái hợp lệ
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
    performed_by_id: assignee_id || user?.id || null,
    performed_by_name: user?.name || "Ca trực An ninh ĐHQGHN",
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
