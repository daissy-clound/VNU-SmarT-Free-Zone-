import { Router } from "express";
import { prisma } from "../server";
import { store } from "../db/store";
import { requireAuth } from "./auth";
import { calculateSLA } from "../tickets/machine";
import { priorityLevels, type PriorityLevel } from "../contracts/ticket";

export const sandboxRouter = Router();

const SANDBOX_TTL_MS = 30 * 60 * 1000;

// Hook phát sự kiện realtime qua Socket.IO để dashboard thấy phiếu thử ngay
let emitSocketEvent: ((event: string, data: any) => void) | null = null;
export function setSandboxSocketEmitter(emitter: (event: string, data: any) => void) {
  emitSocketEvent = emitter;
}

/** Xoá phiếu sandbox (và lịch sử, sự kiện, phản ánh kèm theo) trong CSDL; trả số phiếu đã xoá */
async function deleteSandboxFromDb(createdBefore?: Date): Promise<number> {
  const tickets = await prisma.ticket.findMany({
    where: { is_sandbox: true, ...(createdBefore ? { created_at: { lt: createdBefore } } : {}) },
    select: { code: true },
  });
  const codes = tickets.map((t) => t.code);
  if (!createdBefore) {
    await prisma.report.deleteMany({ where: { is_sandbox: true } });
  }
  if (!codes.length) return 0;
  // Xoá bản ghi con trước để không vi phạm khoá ngoại
  await prisma.report.deleteMany({ where: { ticket_code: { in: codes } } });
  await prisma.ticketHistory.deleteMany({ where: { ticket_code: { in: codes } } });
  await prisma.event.deleteMany({ where: { ticket_code: { in: codes } } });
  const result = await prisma.ticket.deleteMany({ where: { code: { in: codes } } });
  return result.count;
}

/**
 * Tự động dọn dẹp các phiếu Sandbox cũ hơn 30 phút
 * Theo đúng cam kết trong kế hoạch: "phiếu do BGK tạo không lẫn vào số liệu chính và tự xoá sau 30 phút"
 */
export async function cleanupExpiredSandboxTickets(): Promise<number> {
  const cutoff = Date.now() - SANDBOX_TTL_MS;
  for (const t of store.getTickets()) {
    if (t.is_sandbox && Date.parse(t.created_at) < cutoff) {
      store.deleteTicket(t.code);
      emitSocketEvent?.("ticket:deleted", { code: t.code });
    }
  }
  return deleteSandboxFromDb(new Date(cutoff));
}

/**
 * POST /api/sandbox/reset
 * Nút "Đặt lại" trên giao diện dành cho Ban Giám Khảo (BGK)
 * Xoá sạch toàn bộ phiếu thử nghiệm và bản tin thử nghiệm của sandbox
 */
sandboxRouter.post("/reset", requireAuth(["viewer", "manager"]), async (_req, res) => {
  try {
    const deletedInMemory = store.deleteSandboxTickets();
    const deletedInDb = await deleteSandboxFromDb();
    const deleted = Math.max(deletedInMemory, deletedInDb);
    emitSocketEvent?.("sandbox:reset", { deleted_tickets: deleted });
    return res.json({
      ok: true,
      message: deleted
        ? "Đã đặt lại khu thử (sandbox) thành công! Dữ liệu vận hành chính thức không bị thay đổi."
        : "Khu thử (sandbox) hiện đang sạch sẽ, không có dữ liệu cần xoá.",
      deleted_tickets: deleted,
    });
  } catch (error) {
    console.error("[Sandbox Reset Error]", error);
    return res.status(500).json({ error: "Lỗi khi đặt lại sandbox" });
  }
});

/**
 * POST /api/sandbox/ticket
 * Cho phép BGK tự tay tạo một phiếu mô phỏng trực tiếp từ giao diện ("Chạy kịch bản")
 */
sandboxRouter.post("/ticket", requireAuth(["viewer", "manager"]), async (req, res) => {
  try {
    const { zone_code, presence = true } = req.body;
    const priority: PriorityLevel = priorityLevels.includes(req.body.priority) ? req.body.priority : "high";
    if (!zone_code) {
      return res.status(400).json({ error: "Thiếu zone_code" });
    }
    const zone = store.getZone(zone_code);
    if (!zone) {
      return res.status(400).json({ error: `Mã khu vực '${zone_code}' không tồn tại trong danh mục` });
    }

    // Tự sinh mã phiếu sandbox riêng biệt (SF-SBX-XXXX), tránh trùng phiếu đang có
    let code = "";
    do {
      code = `SF-SBX-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (store.getTicket(code));

    const { dueAt } = calculateSLA(priority);
    const user = (req as any).user;
    const ticket = await prisma.ticket.create({
      data: {
        code,
        zone_code,
        source: "both",
        priority,
        status: "received",
        is_sandbox: true,
        presence: Boolean(presence),
        due_at: dueAt,
        feedback_note: "Phiếu thử nghiệm của Ban Giám Khảo (Sandbox)",
      },
    });

    const stored = store.saveTicket({
      code: ticket.code,
      zone_code: ticket.zone_code,
      source: ticket.source as any,
      priority: ticket.priority as any,
      status: ticket.status as any,
      created_at: ticket.created_at.toISOString(),
      updated_at: ticket.updated_at.toISOString(),
      due_at: ticket.due_at ? ticket.due_at.toISOString() : null,
      assignee_id: ticket.assignee_id,
      presence: ticket.presence,
      feedback_note: ticket.feedback_note,
      is_sandbox: true,
      is_trial: false,
      is_overdue: false,
      escalated: false,
    });

    const note = "Tạo phiếu thử nghiệm trong khu Sandbox BGK (cảm biến + phản ánh SV mô phỏng)";
    await prisma.ticketHistory.create({
      data: {
        ticket_code: ticket.code,
        from_status: null,
        to_status: "received",
        action: "create",
        performed_by_id: user.id,
        note,
      },
    });
    store.addHistory({
      id: `hist_${ticket.code}_0`,
      ticket_code: ticket.code,
      from_status: null,
      to_status: "received",
      action: "create",
      performed_by_id: user.id,
      performed_by_name: user.name,
      note,
      created_at: ticket.created_at.toISOString(),
    });

    emitSocketEvent?.("ticket:created", stored);

    return res.status(201).json({
      ok: true,
      message: "Tạo phiếu thử nghiệm sandbox thành công!",
      ticket: stored,
    });
  } catch (error) {
    console.error("[Sandbox Create Ticket Error]", error);
    return res.status(500).json({ error: "Lỗi tạo phiếu sandbox" });
  }
});
