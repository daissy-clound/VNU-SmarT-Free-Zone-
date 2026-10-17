import { Request, Response, Router } from "express";
import { store } from "../db/store";
import { User } from "../contracts/ticket";

export const authRouter = Router();

// Lưu trữ token trong bộ nhớ cho phiên làm việc thử nghiệm
const tokenStore = new Map<string, User>();

/**
 * POST /api/auth/login
 * Đăng nhập 4 vai trò (bql, catruc, phantich, bgk) với mật khẩu chung Demo@2026
 */
authRouter.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: "Vui lòng nhập tên đăng nhập và mật khẩu" });
  }

  const user = store.getUserByUsername(String(username).trim());
  if (!user || user.password_hash !== password) {
    return res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không chính xác" });
  }

  // Cấp token ngẫu nhiên
  const token = `sfz_token_${user.role}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const userInfo: User = {
    id: user.id,
    name: user.name,
    role: user.role as any,
  };

  tokenStore.set(token, userInfo);

  return res.json({
    token,
    user: userInfo,
  });
});

/**
 * GET /api/auth/me
 * Lấy thông tin tài khoản hiện tại từ Bearer token
 */
authRouter.get("/me", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Chưa đăng nhập hoặc thiếu token" });
  }

  const token = authHeader.substring(7);
  const user = tokenStore.get(token);
  if (!user) {
    return res.status(401).json({ error: "Phiên đăng nhập đã hết hạn" });
  }

  return res.json({ user });
});

/**
 * POST /api/auth/logout
 * Đăng xuất và huỷ token
 */
authRouter.post("/logout", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    tokenStore.delete(token);
  }
  return res.json({ ok: true, message: "Đăng xuất thành công" });
});

/**
 * Middleware xác thực token
 */
export function authenticateToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Yêu cầu quyền truy cập (thiếu Bearer token)" });
  }

  const token = authHeader.substring(7);
  const user = tokenStore.get(token);
  if (!user) {
    return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" });
  }

  (req as any).user = user;
  next();
}
