import { Router } from "express";
import { prisma } from "../server";
import { requireAuth } from "./auth";

export const rollingDatesRouter = Router();

/**
 * Hàm tự động dời ngày cho toàn bộ dữ liệu (Rolling Dates)
 * Đảm bảo dữ liệu tuần gần nhất luôn kết thúc vào đúng ngày hiện tại (hôm nay),
 * giúp Ban Giám Khảo mở hệ thống lúc nào cũng thấy dữ liệu tươi mới.
 */
export async function rollDataDates(targetDate: Date = new Date()): Promise<{
  shifted_days: number;
  tickets_updated: number;
  telemetries_updated: number;
}> {
  // Tìm mốc thời gian lớn nhất của tickets
  const latestTicket = await prisma.ticket.findFirst({
    orderBy: { created_at: "desc" },
    select: { created_at: true },
  });

  const latestTelemetry = await prisma.telemetry.findFirst({
    orderBy: { ts: "desc" },
    select: { ts: true },
  });

  let maxDate = new Date("2026-10-16T12:00:00Z");
  if (latestTicket && latestTicket.created_at > maxDate) {
    maxDate = latestTicket.created_at;
  }
  if (latestTelemetry && latestTelemetry.ts > maxDate) {
    maxDate = latestTelemetry.ts;
  }

  const diffMs = targetDate.getTime() - maxDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { shifted_days: 0, tickets_updated: 0, telemetries_updated: 0 };
  }

  // Dời ngày cho Tickets
  const allTickets = await prisma.ticket.findMany({
    select: { code: true, created_at: true, updated_at: true, due_at: true },
  });

  let ticketCount = 0;
  for (const t of allTickets) {
    const newCreatedAt = new Date(t.created_at.getTime() + diffMs);
    const newUpdatedAt = new Date(t.updated_at.getTime() + diffMs);
    const newDueAt = t.due_at ? new Date(t.due_at.getTime() + diffMs) : null;

    await prisma.ticket.update({
      where: { code: t.code },
      data: {
        created_at: newCreatedAt,
        updated_at: newUpdatedAt,
        due_at: newDueAt,
      },
    });
    ticketCount++;
  }

  // Dời ngày cho Telemetry
  const allTelemetries = await prisma.telemetry.findMany({
    select: { id: true, ts: true },
  });

  let telemetryCount = 0;
  for (const tel of allTelemetries) {
    const newTs = new Date(tel.ts.getTime() + diffMs);
    await prisma.telemetry.update({
      where: { id: tel.id },
      data: { ts: newTs },
    });
    telemetryCount++;
  }

  // Dời ngày cho Events
  const allEvents = await prisma.event.findMany({
    select: { event_id: true, started_at: true, ended_at: true },
  });
  for (const ev of allEvents) {
    const newStarted = new Date(ev.started_at.getTime() + diffMs);
    const newEnded = ev.ended_at ? new Date(ev.ended_at.getTime() + diffMs) : null;
    await prisma.event.update({
      where: { event_id: ev.event_id },
      data: { started_at: newStarted, ended_at: newEnded },
    });
  }

  return {
    shifted_days: diffDays,
    tickets_updated: ticketCount,
    telemetries_updated: telemetryCount,
  };
}

/**
 * POST /api/admin/roll-dates
 * Trigger thủ công hoặc từ cron job hàng đêm để cập nhật mốc thời gian
 */
rollingDatesRouter.post("/roll-dates", requireAuth(["manager"]), async (req, res) => {
  try {
    const result = await rollDataDates();
    return res.json({
      ok: true,
      message: `Đã dời ngày thành công! Dữ liệu được dịch chuyển ${result.shifted_days} ngày để khớp hôm nay.`,
      result,
    });
  } catch (error) {
    console.error("[Roll Dates Error]", error);
    return res.status(500).json({ error: "Lỗi dời ngày dữ liệu" });
  }
});
