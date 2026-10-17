import { z } from "zod";

export const reportSchema = z
  .object({
    zone_code: z.string().min(1),
    type: z.enum(["smoke_now", "smell", "vape", "butts", "other"]),
    ongoing: z.boolean(),
    emergency: z.boolean(),
    note: z.string().max(1000).default(""),
    device_token: z.string().min(8).max(128),
  })
  .strict();
