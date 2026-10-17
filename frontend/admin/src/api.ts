import {
  loginSchema,
  ticketListSchema,
  userSchema,
  zoneListSchema,
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
      data.message || `Không thể tải dữ liệu (${response.status}).`,
    );
  return data;
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
};
export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.name === "ZodError")
    return "Dữ liệu máy chủ chưa đúng hợp đồng. Vui lòng liên hệ nhóm kỹ thuật.";
  return "Không kết nối được máy chủ. Kiểm tra mạng và thử lại.";
}
