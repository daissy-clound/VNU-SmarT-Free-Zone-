import { Router } from "express";
import { prisma } from "../server";
import { store } from "../db/store";
import { requireAuth } from "./auth";

export const sandboxRouter = Router();

/**
 * Tự động dọn dẹp các phiếu Sandbox cũ hơn 30 phút
 * Theo đúng cam kết trong kế hoạch: "phiếu do BGK tạo không lẫn vào số liệu chính và tự xoá sau 30 phút"
 */
export async function cleanupExpiredSandboxTickets(): Promise<number> {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const result = await prisma.ticket.deleteMany({
    where: {
      is_sandbox: true,
      created_at: {
        lt: thirtyMinutesAgo,
      },
    },
  });
  return result.count;
}

/**
 * POST /api/sandbox/reset
 * Nút "Đặt lại" trên giao diện dành cho Ban Giám Khảo (BGK)
 * Xoá sạch toàn bộ phiếu thử nghiệm và bản tin thử nghiệm của sandbox
 */
sandboxRouter.post("/reset", requireAuth(["viewer", "manager"]), async (req, res) => {
  try {
    // 1. Xoá tất cả report trong sandbox
    await prisma.report.deleteMany({
      where: {
        is_sandbox: true,
      },
    });

    // 2. Xoá lịch sử của các ticket sandbox
    const sandboxTickets = await prisma.ticket.findMany({
      where: { is_sandbox: true },
      select: { code: true },
    });
    const codes = sandboxTickets.map((t) => t.code);

    if (codes.length > 0) {
      await prisma.ticketHistory.deleteMany({
        where: { ticket_code: { in: codes } },
      });

      await prisma.event.deleteMany({
        where: { ticket_code: { in: codes } },
      });

      // 3. Xoá tất cả ticket sandbox
      const deleteResult = await prisma.ticket.deleteMany({
        where: { is_sandbox: true },
      });

      store.deleteSandboxTickets();

      return res.json({
        ok: true,
        message: "Đã đặt lại khu thử (sandbox) thành công! Dữ liệu vận hành chính thức không bị thay đổi.",
        deleted_tickets: deleteResult.count,
      });
    }

    store.deleteSandboxTickets();

    return res.json({
      ok: true,
      message: "Khu thử (sandbox) hiện đang sạch sẽ, không có dữ liệu cần xoá.",
      deleted_tickets: 0,
    });
  } catch (error) {
    console.error("[Sandbox Reset Error]", error);
    return res.status(500).json({ error: "Lỗi khi đặt lại sandbox" });
  }
});

/**
 * POST /api/sandbox/ticket
 * Cho phép BGK tự tay tạo một phiếu mô phỏng trực tiếp từ giao diện
 */
sandboxRouter.post("/ticket", requireAuth(["viewer", "manager"]), async (req, res) => {
  try {
    const { zone_code, priority = "high", presence = true } = req.body;
    if (!zone_code) {
      return res.status(400).json({ error: "Thiếu zone_code" });
    }

    // Tự sinh mã phiếu sandbox riêng biệt (SF-SBX-XXX)
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const code = `SF-SBX-${randomSuffix}`;

    const ticket = await prisma.ticket.create({
      data: {
        code,
        zone_code,
        source: "both",
        priority,
        status: "received",
        is_sandbox: true,
        presence: Boolean(presence),
        feedback_note: "Phiếu thử nghiệm của Ban Giám Khảo (Sandbox)",
      },
    });

    store.saveTicket({
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

    await prisma.ticketHistory.create({
      data: {
        ticket_code: ticket.code,
        from_status: null,
        to_status: "received",
        action: "create",
        performed_by_id: (req as any).user.id,
        note: "Tạo phiếu thử nghiệm trong khu Sandbox BGK",
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Tạo phiếu thử nghiệm sandbox thành công!",
      ticket,
    });
  } catch (error) {
    console.error("[Sandbox Create Ticket Error]", error);
    return res.status(500).json({ error: "Lỗi tạo phiếu sandbox" });
  }
});
