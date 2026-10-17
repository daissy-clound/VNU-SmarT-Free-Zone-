import { z } from "zod";

export const zoneSchema = z.object({
  code: z.string(),
  name: z.string(),
  building: z.enum(["A", "B"]),
  floor: z.number().int().min(1).max(6),
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(560),
  sensor_id: z.string().nullable(),
  qr_id: z.string(),
  sensor_state: z.enum(["normal", "suspected", "offline", "unknown"]),
  presence: z.boolean().nullable(),
});
export type Zone = z.infer<typeof zoneSchema>;
export const zoneListSchema = z.object({
  items: z.array(zoneSchema),
  coordinates_status: z.enum(["provisional", "approved"]),
});
