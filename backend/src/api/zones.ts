import { Request, Response, Router } from "express";
import { store } from "../db/store";

export const zonesRouter = Router();

let emitSocketEvent: ((event: string, data: any) => void) | null = null;
export function setZonesSocketEmitter(emitter: (event: string, data: any) => void) {
  emitSocketEvent = emitter;
}

/**
 * GET /api/zones
 * Lấy danh mục 20 khu vực và trạng thái các cảm biến
 * Format: { items: Zone[], coordinates_status: "approved" | "provisional" }
 */
zonesRouter.get("/", (req: Request, res: Response) => {
  const items = store.getZones();
  return res.json({
    items,
    coordinates_status: "approved",
  });
});

/**
 * PATCH /api/zones/:code/sensor
 * Cập nhật trạng thái cảm biến hoặc hiện diện (cho giả lập / MQTT ingest)
 */
zonesRouter.patch("/:code/sensor", (req: Request, res: Response) => {
  const code = req.params.code;
  const { sensor_state, presence } = req.body || {};

  const zone = store.getZone(code);
  if (!zone) {
    return res.status(404).json({ error: "Không tìm thấy khu vực" });
  }

  if (sensor_state !== undefined) {
    zone.sensor_state = sensor_state;
  }
  if (presence !== undefined) {
    zone.presence = presence;
  }

  if (emitSocketEvent) {
    emitSocketEvent("zone:updated", zone);
  }

  return res.json({ ok: true, zone });
});
