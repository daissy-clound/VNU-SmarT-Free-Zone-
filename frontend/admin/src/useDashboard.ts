import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { Ticket, Zone } from "../../../backend/src/contracts";
import { api, API_URL, ApiError, errorMessage } from "./api";

export function useDashboard(token: string, onExpired: () => void) {
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
    socket.on("ticket:created", () => void refresh());
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
