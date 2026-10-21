import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { Ticket, Zone } from "../../../backend/src/contracts";
import { api, API_URL, ApiError, errorMessage } from "./api";

/** Cảnh báo realtime: phiếu mới (ticket:created) hoặc cảnh báo cảm biến cho ca trực (guard:alert) */
export interface LiveAlert {
  ticket_code: string;
  zone_code: string;
  source: "ticket" | "sensor";
  presence: boolean | null;
  priority?: string;
  /** Lúc máy chủ phát cảnh báo (để đo độ trễ) */
  dispatched_at: string | null;
  received_at: string;
}

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
) {
  const alertRef = useRef(onAlert);
  alertRef.current = onAlert;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
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
      const [items, areas] = await Promise.all([
        api.tickets(token),
        api.zones(token),
      ]);
      if (current !== revision.current) return;
      setTickets(items);
      setZones(areas.items);
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
    // Một phiếu có thể đến từ cả ticket:created lẫn guard:alert → chỉ báo một lần
    const seen = new Map<string, number>();
    const emit = (alert: LiveAlert) => {
      const last = seen.get(alert.ticket_code) ?? 0;
      if (Date.now() - last < 30_000) return;
      seen.set(alert.ticket_code, Date.now());
      alertRef.current?.(alert);
    };
    socket.on("ticket:created", (ticket?: Ticket) => {
      void refresh();
      if (ticket?.code)
        emit({
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
  }, [token, refresh]);
  return {
    tickets,
    zones,
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
