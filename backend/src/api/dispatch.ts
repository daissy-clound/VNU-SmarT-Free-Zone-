import { Request, Response, Router } from "express";
import { roomOfUser } from "../contracts/dispatch";
import { DispatchError, dispatchService } from "../dispatch/service";
import { requireAuth } from "./auth";

export const dispatchRouter = Router();

export function setDispatchSocketEmitter(emitter: (event: string, data: any) => void) {
  dispatchService.setEmitter(emitter);
}

const fail = (res: Response, err: unknown) =>
  err instanceof DispatchError
    ? res.status(err.status).json({ error: err.message })
    : res.status(500).json({ error: "Không xử lý được yêu cầu điều phối" });

/**
 * GET /api/dispatch/rooms
 * Phòng trực (4 phòng trực giảng UET1–4 + Phòng bảo vệ): đang trực hay không, cán bộ và số phiếu đang xử lý
 */
dispatchRouter.get("/rooms", requireAuth(), (_req: Request, res: Response) => {
  res.json(dispatchService.rooms());
});

/**
 * GET /api/dispatch
 * Bản ghi điều phối. Phòng trực chỉ thấy phiếu của phòng mình.
 */
dispatchRouter.get("/", requireAuth(), (req: Request, res: Response) => {
  const user = (req as any).user;
  let items = dispatchService.list();
  if (user.role === "guard") {
    const room = roomOfUser(user.id);
    items = room ? items.filter((d) => d.room_id === room.id) : [];
  }
  res.json({ items });
});

/**
 * POST /api/dispatch  { ticket_code, room_id, note? }
 * Ban quản lý điều phối (hoặc chuyển) phiếu cho một phòng trực. Chỉ khi phiếu chưa có người nhận.
 */
dispatchRouter.post("/", requireAuth(["manager"]), (req: Request, res: Response) => {
  const { ticket_code, room_id, note } = req.body || {};
  if (!ticket_code || !room_id) return res.status(400).json({ error: "Thiếu mã phiếu hoặc phòng trực" });
  try {
    const user = (req as any).user;
    res.status(201).json({ ok: true, dispatch: dispatchService.dispatch(ticket_code, room_id, user, note) });
  } catch (err) {
    fail(res, err);
  }
});

/**
 * POST /api/dispatch/:code/call
 * Ghi nhận Ban quản lý đã gọi điện cho phòng trực (quá 3 phút chưa nhận)
 */
dispatchRouter.post("/:code/call", requireAuth(["manager"]), (req: Request, res: Response) => {
  try {
    res.json({ ok: true, dispatch: dispatchService.call(req.params.code, (req as any).user) });
  } catch (err) {
    fail(res, err);
  }
});
