import { z } from "zod";
import {
  dispatchListSchema,
  dispatchSchema,
  loginSchema,
  roomListSchema,
  telemetrySchema,
  ticketHistorySchema,
  ticketListSchema,
  ticketSchema,
  userSchema,
  zoneListSchema,
  zoneSchema,
  type Ticket,
  type TicketHistory,
  type TicketStatus,
  type Zone,
} from "../../../backend/src/contracts";

export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function request(
  path: string,
  token?: string,
  options: RequestInit = {},
) {
  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    signal: options.signal || AbortSignal.timeout(10000),
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(
      response.status,
      data.error ||
        data.message ||
        `Không thể tải dữ liệu (${response.status}).`,
    );
  return data;
}

/** Schema trong contracts dùng zod của backend → parse từng phần, không lồng vào zod của dashboard */
export interface TicketDetail {
  ticket: Ticket;
  zone: Zone | null;
  history: TicketHistory[];
}

export const api = {
  login: async (values: { username: string; password: string }) =>
    loginSchema.parse(
      await request("/auth/login", undefined, {
        method: "POST",
        body: JSON.stringify(values),
      }),
    ),
  me: async (token: string) =>
    userSchema.parse((await request("/auth/me", token)).user),
  logout: (token: string) => request("/auth/logout", token, { method: "POST" }),
  tickets: async (token: string) =>
    ticketListSchema.parse(await request("/tickets", token)).items,
  zones: async (token: string) =>
    zoneListSchema.parse(await request("/zones", token)),
  ticket: async (token: string, code: string): Promise<TicketDetail> => {
    const raw = await request(`/tickets/${encodeURIComponent(code)}`, token);
    return {
      ticket: ticketSchema.parse(raw.ticket),
      zone: raw.zone ? zoneSchema.parse(raw.zone) : null,
      history: (raw.history ?? []).map((h: unknown) => ticketHistorySchema.parse(h)),
    };
  },
  /** Chuyển đúng một bước theo luật 6 bước của A; ghi chú lưu vào lịch sử phiếu */
  setStatus: async (
    token: string,
    code: string,
    body: { status: TicketStatus; note?: string; assignee_id?: string },
  ) =>
    request(`/tickets/${encodeURIComponent(code)}/status`, token, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  /** Cửa sổ bản tin gần nhất của nút cảm biến (máy chủ hiện giữ ~60 giây) */
  telemetry: async (token: string, nodeId: string) => {
    const raw = await request(`/telemetry/recent/${encodeURIComponent(nodeId)}`, token);
    return ((raw.items ?? []) as unknown[]).map((t) => telemetrySchema.parse(t));
  },
  /** Phòng trực (4 phòng trực giảng + Phòng bảo vệ): đang trực, cán bộ, tải việc */
  rooms: async (token: string) => roomListSchema.parse(await request("/dispatch/rooms", token)),
  /** Bản ghi điều phối (phòng trực chỉ nhận bản ghi của phòng mình) */
  dispatches: async (token: string) => dispatchListSchema.parse(await request("/dispatch", token)).items,
  /** Ban quản lý điều phối / chuyển phiếu cho phòng trực */
  dispatch: async (token: string, body: { ticket_code: string; room_id: string; note?: string }) =>
    dispatchSchema.parse(
      (await request("/dispatch", token, { method: "POST", body: JSON.stringify(body) })).dispatch,
    ),
  /** Ghi nhận đã gọi điện phòng trực (quá hạn nhận) */
  callRoom: async (token: string, code: string) =>
    dispatchSchema.parse(
      (await request(`/dispatch/${encodeURIComponent(code)}/call`, token, { method: "POST" })).dispatch,
    ),
  vapidKey: async () =>
    z
      .object({ publicKey: z.string() })
      .parse(await request("/notify/vapid-public-key")).publicKey,
  subscribePush: (
    token: string,
    body: {
      endpoint: string;
      keys?: { p256dh?: string; auth?: string };
      user_id: string;
      device_name: string;
    },
  ) =>
    request("/notify/subscribe", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  /** Các API Analytics, AI & Infographics cho BQL và BGK */
  heatmapStats: (token?: string, building?: string) =>
    request(`/stats/heatmap${building ? `?building=${encodeURIComponent(building)}` : ""}`, token),
  forecast: (token?: string) => request("/stats/forecast", token),
  transparency: (token?: string) => request("/stats/transparency", token),
  weeklyReport: (token?: string) => request("/stats/weekly-report", token),
  infographics: (token?: string) => request("/infographics", token),
  uploadInfographic: (
    token: string,
    body: { title: string; image_data?: string; image_url?: string; building?: string; zone_code?: string },
  ) =>
    request("/infographics", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  resetSandbox: (token: string) =>
    request("/sandbox/reset", token, { method: "POST" }) as Promise<{ message: string; deleted_tickets: number }>,
  createSandboxTicket: (token: string, zone_code: string) =>
    request("/sandbox/ticket", token, {
      method: "POST",
      body: JSON.stringify({ zone_code, presence: true }),
    }).then((res: { ticket: unknown }) => ticketSchema.parse(res.ticket)),
};
export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.name === "ZodError")
    return "Dữ liệu máy chủ chưa đúng hợp đồng. Vui lòng liên hệ nhóm kỹ thuật.";
  return "Không kết nối được máy chủ. Kiểm tra mạng và thử lại.";
}
