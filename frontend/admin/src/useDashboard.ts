import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  roomOfUser,
  type Dispatch,
  type RoomList,
  type Ticket,
  type User,
  type Zone,
} from "../../../backend/src/contracts";
import { api, API_URL, ApiError, errorMessage } from "./api";

/**
 * Cảnh báo realtime:
 * - new: phiếu mới cần Ban quản lý xác minh (ticket:created / guard:alert)
 * - dispatched: Ban quản lý điều phối phiếu cho phòng trực của người dùng (dispatch:assigned)
 * - overdue: phòng trực quá 3 phút chưa nhận → Ban quản lý gọi điện (dispatch:overdue)
 */
export interface LiveAlert {
  kind: "new" | "dispatched" | "overdue";
  ticket_code: string;
  zone_code: string;
  source: "ticket" | "sensor";
  presence: boolean | null;
  priority?: string;
  room_name?: string;
  room_phone?: string;
  /** Lúc máy chủ phát cảnh báo (để đo độ trễ) */
  dispatched_at: string | null;
  received_at: string;
}

type DispatchEvent = Dispatch & {
  room_name: string;
  room_phone?: string;
  zone_code: string;
  presence?: boolean | null;
  priority?: string;
};

type GuardAlert = {
  ticket_code?: string;
  zone_code: string;
  presence_status?: "present" | "absent" | "unknown";
  priority?: string;
  dispatched_at?: string;
  timestamp?: string;
};

export function useDashboard(
  token: string,
  onExpired: () => void,
  onAlert?: (alert: LiveAlert) => void,
  user?: Pick<User, "id" | "role">,
) {
  const alertRef = useRef(onAlert);
  alertRef.current = onAlert;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [rooms, setRooms] = useState<RoomList | null>(null);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [provisional, setProvisional] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const [lastSync, setLastSync] = useState<Date>();
  const [now, setNow] = useState(Date.now());
  const revision = useRef(0);
  const requests = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++revision.current;
    requests.current++;
    try {
      const [items, areas, roomList, dispatchList] = await Promise.all([
        api.tickets(token),
        api.zones(token),
        api.rooms(token),
        api.dispatches(token),
      ]);
      if (current !== revision.current) return;
      setTickets(items);
      setZones(areas.items);
      setRooms(roomList);
      setDispatches(dispatchList);
      setProvisional(areas.coordinates_status === "provisional");
      setError("");
      setLastSync(new Date());
    } catch (error) {
      if (current !== revision.current) return;
      if (error instanceof ApiError && error.status === 401) onExpired();
      else setError(errorMessage(error));
    } finally {
      requests.current--;
      if (current === revision.current) setLoading(false);
    }
  }, [token, onExpired]);
  useEffect(() => {
    void refresh();
    const socket = io(API_URL || window.location.origin, {
      auth: { token },
      reconnection: true,
    });
    socket.on("connect", () => {
      setLive(true);
      void refresh();
    });
    socket.on("disconnect", () => setLive(false));
    socket.on("connect_error", () => setLive(false));
    // Một phiếu có thể đến từ cả ticket:created lẫn guard:alert → chỉ báo một lần.
    // Phòng trực chỉ nhận phiếu Ban quản lý đã điều phối cho phòng mình; Ban quản lý nhận phiếu mới và phiếu quá hạn nhận.
    const role = user?.role;
    const myRoom = user ? roomOfUser(user.id)?.id : undefined;
    const wants = (kind: LiveAlert["kind"]) =>
      kind === "dispatched" ? role === "guard" : kind === "overdue" ? role === "manager" : role !== "guard";
    const seen = new Map<string, number>();
    const emit = (alert: LiveAlert) => {
      if (!wants(alert.kind)) return;
      const key = `${alert.kind}:${alert.ticket_code}`;
      const last = seen.get(key) ?? 0;
      if (Date.now() - last < 30_000) return;
      seen.set(key, Date.now());
      alertRef.current?.(alert);
    };
    const fromDispatch = (kind: LiveAlert["kind"], d: DispatchEvent): LiveAlert => ({
      kind,
      ticket_code: d.ticket_code,
      zone_code: d.zone_code,
      source: "ticket",
      presence: d.presence ?? null,
      priority: d.priority,
      room_name: d.room_name,
      room_phone: d.room_phone,
      dispatched_at: d.dispatched_at,
      received_at: new Date().toISOString(),
    });
    socket.on("dispatch:assigned", (d?: DispatchEvent) => {
      void refresh();
      if (d?.ticket_code && d.room_id === myRoom) emit(fromDispatch("dispatched", d));
    });
    socket.on("dispatch:overdue", (d?: DispatchEvent) => {
      void refresh();
      if (d?.ticket_code) emit({ ...fromDispatch("overdue", d), dispatched_at: d.accept_deadline });
    });
    socket.on("dispatch:updated", () => void refresh());
    socket.on("ticket:created", (ticket?: Ticket) => {
      void refresh();
      if (ticket?.code)
        emit({
          kind: "new",
          ticket_code: ticket.code,
          zone_code: ticket.zone_code,
          source: ticket.source === "sensor" ? "sensor" : "ticket",
          presence: ticket.presence ?? null,
          priority: ticket.priority,
          dispatched_at: ticket.created_at ?? null,
          received_at: new Date().toISOString(),
        });
    });
    socket.on("guard:alert", (alert?: GuardAlert) => {
      void refresh();
      if (alert?.ticket_code)
        emit({
          kind: "new",
          ticket_code: alert.ticket_code,
          zone_code: alert.zone_code,
          source: "sensor",
          presence:
            alert.presence_status === "present" ? true : alert.presence_status === "absent" ? false : null,
          priority: alert.priority,
          dispatched_at: alert.dispatched_at ?? alert.timestamp ?? null,
          received_at: new Date().toISOString(),
        });
    });
    socket.on("ticket:updated", () => void refresh());
    socket.on("zone:updated", () => void refresh());
    // Đối soát định kỳ cả khi socket đang nối: bù sự kiện bị mất khi mất mạng.
    const poll = window.setInterval(() => {
      if (requests.current === 0) void refresh();
    }, 5000);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    return () => {
      revision.current++;
      socket.disconnect();
      clearInterval(poll);
      clearInterval(tick);
      window.removeEventListener("focus", focus);
    };
  }, [token, refresh, user?.id, user?.role]);
  return {
    tickets,
    zones,
    rooms,
    dispatches,
    provisional,
    loading,
    error,
    live,
    lastSync,
    now,
    refresh,
  };
}
export type DashboardData = ReturnType<typeof useDashboard>;
