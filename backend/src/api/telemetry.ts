import { Request, Response, Router } from "express";
import { telemetryIngestService } from "../ingest/mqtt";

export const telemetryRouter = Router();

/**
 * POST /api/telemetry
 * Nhận bản tin đo lường từ cảm biến (HTTP Gateway / Wokwi / Test Bridge)
 */
telemetryRouter.post("/", async (req: Request, res: Response) => {
  const result = await telemetryIngestService.processTelemetry(req.body);

  if (result.status === "invalid") {
    return res.status(400).json({ error: result.error });
  }

  return res.status(200).json({
    ok: true,
    status: result.status,
    ticket: result.ticket,
    event: result.event,
  });
});

/**
 * GET /api/telemetry/recent/:nodeId
 * Lấy lịch sử cửa sổ 1 phút gần nhất của nút cảm biến
 */
telemetryRouter.get("/recent/:nodeId", (req: Request, res: Response) => {
  const nodeId = req.params.nodeId;
  const items = telemetryIngestService.getRecentTelemetries(nodeId);
  return res.json({ items });
});
