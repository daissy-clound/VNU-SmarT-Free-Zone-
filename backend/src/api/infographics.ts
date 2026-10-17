import { Request, Response, Router } from "express";
import { store } from "../db/store";
import { Infographic } from "../contracts/ticket";

export const infographicsRouter = Router();

/**
 * GET /api/infographics
 * Lấy danh sách infographic tuyên truyền đang kích hoạt
 */
infographicsRouter.get("/", (req: Request, res: Response) => {
  const items = store.getInfographics();
  return res.json({ items });
});

/**
 * POST /api/infographics
 * BQL đăng infographic mới (≤ 2 MB, hiển thị ngay trên app SV và dashboard)
 */
infographicsRouter.post("/", (req: Request, res: Response) => {
  const { title, image_url, building, zone_code } = req.body || {};

  if (!title || !image_url) {
    return res.status(400).json({ error: "Thiếu tiêu đề hoặc đường dẫn hình ảnh" });
  }

  const newInfo: Infographic = {
    id: `info_${Date.now()}`,
    title,
    image_url,
    building: building || null,
    zone_code: zone_code || null,
    created_by_id: (req as any).user?.id || "usr_bql",
    is_active: true,
    created_at: new Date().toISOString(),
  };

  store.saveInfographic(newInfo);
  return res.status(201).json({ ok: true, item: newInfo });
});
