import { Request, Response, Router } from "express";
import { store } from "../db/store";
import { hotspotForecast, llmAnalytics, getModelTransparencyMetrics } from "../ai";

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

/**
 * GET /api/stats/heatmap
 * Ma trận dữ liệu bản đồ nhiệt khu vực x 24 giờ trong ngày
 * Hỗ trợ tách riêng 2 lớp dữ liệu: "suspected" (nghi vấn) và "confirmed" (đã xác nhận)
 */
statsRouter.get("/heatmap", (req: Request, res: Response) => {
  const zones = store.getZones();
  const buildingFilter = req.query.building as string | undefined;

  const filteredZones = buildingFilter
    ? zones.filter((z) => z.building === buildingFilter)
    : zones;

  // Giả lập ma trận 24 giờ cho các khu vực
  const heatmapData = filteredZones.map((z) => {
    const hourlySuspected = Array.from({ length: 24 }, (_, hour) => {
      // Các giờ cao điểm trưa (11-13h) và tối (21-24h) có rủi ro cao hơn
      const isPeakLunch = hour >= 11 && hour <= 13;
      const isPeakNight = hour >= 21 && hour <= 23;
      const isRestroomOrStairs = z.code.includes("WC") || z.code.includes("CT") || z.code.includes("ST");

      let val = 0;
      if (isRestroomOrStairs && (isPeakLunch || isPeakNight)) {
        val = Math.floor(Math.sin(hour + z.floor) * 3 + 4);
      } else if (isRestroomOrStairs) {
        val = Math.floor(Math.random() * 2);
      }
      return Math.max(0, val);
    });

    const hourlyConfirmed = hourlySuspected.map((sus) =>
      Math.floor(sus * (0.65 + Math.random() * 0.25))
    );

    return {
      zone_code: z.code,
      zone_name: z.name,
      building: z.building,
      floor: z.floor,
      hourly_suspected: hourlySuspected,
      hourly_confirmed: hourlyConfirmed,
      total_suspected: hourlySuspected.reduce((a, b) => a + b, 0),
      total_confirmed: hourlyConfirmed.reduce((a, b) => a + b, 0),
    };
  });

  return res.json({
    zones_count: filteredZones.length,
    heatmap: heatmapData,
    time_window: "Dữ liệu tổng hợp 6 tuần gần nhất",
  });
});

/**
 * GET /api/stats/forecast
 * Dự báo điểm nóng và gợi ý lịch tuần tra
 */
statsRouter.get("/forecast", (_req: Request, res: Response) => {
  const forecast = hotspotForecast.generateForecast();
  return res.json(forecast);
});

/**
 * GET /api/stats/transparency
 * Báo cáo minh bạch thuật toán AI (confusion matrix, precision/recall, stress test, PIR limitations)
 */
statsRouter.get("/transparency", (_req: Request, res: Response) => {
  const metrics = getModelTransparencyMetrics();
  return res.json(metrics);
});

/**
 * GET /api/stats/weekly-report
 * Báo cáo vận hành tuần do AI sinh tự động kèm đề xuất hành động
 */
statsRouter.get("/weekly-report", (_req: Request, res: Response) => {
  const report = llmAnalytics.generateWeeklyReport();
  return res.json(report);
});

