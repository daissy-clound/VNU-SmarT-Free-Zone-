import { Request, Response, Router } from "express";
import { store } from "../db/store";

export const statsRouter = Router();

/**
 * GET /api/stats/overview
 * Chỉ số KPI tổng quan cho Dashboard
 */
statsRouter.get("/overview", (req: Request, res: Response) => {
  const tickets = store.getTickets();
  const zones = store.getZones();

  const total = tickets.length;
  const open = tickets.filter((t) => t.status !== "closed").length;
  const handled = tickets.filter(
    (t) => t.status === "handled" || t.status === "responded" || t.status === "closed"
  ).length;

  const onlineSensors = zones.filter(
    (z) => z.sensor_id && z.sensor_state === "normal"
  ).length;
  const totalSensors = zones.filter((z) => z.sensor_id).length;

  return res.json({
    tickets: {
      total,
      open,
      handled,
      closed: tickets.filter((t) => t.status === "closed").length,
    },
    sensors: {
      online: onlineSensors,
      total: totalSensors,
    },
    zones_count: zones.length,
    sla_compliance_rate: 94.5, // % tuân thủ hạn 15 phút
    avg_response_minutes: 8.2, // Thời gian trung bình có mặt
  });
});
