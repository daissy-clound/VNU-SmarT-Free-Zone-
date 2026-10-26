import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Card, Segmented } from "antd";
import { Heatmap, type HeatRow } from "../components/Heatmap";
import { api } from "../api";
import type { DashboardData } from "../useDashboard";
import { isFalseAlarm } from "../workflow";

type Layer = "suspected" | "confirmed";
type Period = "7" | "30" | "all";

const DONE = ["handled", "responded", "closed"];
const buildingLabel: Record<string, string> = { UET1: "UET1", UET2: "UET2", UET3: "UET3", UET4: "UET4", DN: "Nhà ĐN", CONG: "Cổng" };

/**
 * Bản đồ nhiệt "khu vực × giờ trong ngày".
 * - Nghi vấn: mọi tin báo (cảm biến, phản ánh SV), kể cả chưa xác minh.
 * - Đã xác nhận: phiếu đã xử lý và KHÔNG bị ca trực đánh dấu báo nhầm.
 * Hai lớp luôn tách riêng: AI và phản ánh chỉ là nghi vấn cho tới khi người xác minh.
 */
export function HeatmapPage({ data, token }: { data: DashboardData; token: string }) {
  const navigate = useNavigate();
  const [layer, setLayer] = useState<Layer>("suspected");
  const [period, setPeriod] = useState<Period>("30");
  const [building, setBuilding] = useState("all");
  const [falseAlarms, setFalseAlarms] = useState<Set<string> | null>(null);

  // Phiếu đã xử lý: đọc lịch sử để loại phiếu báo nhầm khỏi lớp "Đã xác nhận"
  const doneCodes = useMemo(
    () => data.tickets.filter((t) => DONE.includes(t.status)).map((t) => t.code).slice(0, 150).join(","),
    [data.tickets],
  );
  useEffect(() => {
    if (layer !== "confirmed") return;
    let alive = true;
    const codes = doneCodes ? doneCodes.split(",") : [];
    Promise.all(codes.map((c) => api.ticket(token, c).then((d) => (isFalseAlarm(d.history) ? c : null)).catch(() => null))).then(
      (list) => alive && setFalseAlarms(new Set(list.filter((c): c is string => !!c))),
    );
    return () => {
      alive = false;
    };
  }, [layer, doneCodes, token]);

  const buildings = useMemo(() => [...new Set(data.zones.map((z) => z.building))], [data.zones]);
  const since = period === "all" ? 0 : data.now - Number(period) * 86_400_000;

  const { rows, total } = useMemo(() => {
    const counts = new Map<string, number[]>();
    let total = 0;
    for (const t of data.tickets) {
      const at = Date.parse(t.created_at);
      if (at < since) continue;
      if (layer === "confirmed" && (!DONE.includes(t.status) || !falseAlarms || falseAlarms.has(t.code))) continue;
      const row = counts.get(t.zone_code) ?? Array(24).fill(0);
      row[new Date(at).getHours()] += 1;
      counts.set(t.zone_code, row);
      total += 1;
    }
    const zones = data.zones.filter((z) => building === "all" || z.building === building);
    const rows: HeatRow[] = zones
      .map((z) => ({ code: z.code, label: z.name, counts: counts.get(z.code) ?? Array(24).fill(0) }))
      // Xem cả trường: chỉ giữ khu vực có dữ liệu cho gọn; xem một toà: giữ đủ khu vực
      .filter((r) => building !== "all" || r.counts.some(Boolean))
      .sort((a, b) => b.counts.reduce((x, y) => x + y, 0) - a.counts.reduce((x, y) => x + y, 0));
    return { rows, total };
  }, [data.tickets, data.zones, layer, since, building, falseAlarms]);

  const loadingConfirmed = layer === "confirmed" && falseAlarms === null;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Bản đồ nhiệt</h1>
        </div>
      </div>
      <Card>
        <div className="heat-filters" role="group" aria-label="Bộ lọc bản đồ nhiệt">
          <Segmented
            aria-label="Lớp dữ liệu"
            value={layer}
            onChange={(v) => setLayer(v as Layer)}
            options={[
              { label: "Nghi vấn", value: "suspected" },
              { label: "Đã xác nhận", value: "confirmed" },
            ]}
          />
          <Segmented
            aria-label="Khoảng thời gian"
            value={period}
            onChange={(v) => setPeriod(v as Period)}
            options={[
              { label: "7 ngày", value: "7" },
              { label: "30 ngày", value: "30" },
              { label: "Tất cả", value: "all" },
            ]}
          />
          <Segmented
            aria-label="Toà nhà"
            value={building}
            onChange={(v) => setBuilding(String(v))}
            options={[{ label: "Cả trường", value: "all" }, ...buildings.map((b) => ({ label: buildingLabel[b] ?? b, value: b }))]}
          />
        </div>
        <p className="muted">
          {layer === "suspected"
            ? "Số tin báo theo giờ, gồm cả tin chưa xác minh."
            : "Chỉ phiếu đã xác minh; phiếu đánh dấu báo nhầm bị loại."}{" "}
          {loadingConfirmed ? "Đang đọc kết quả xác minh…" : `Tổng: ${total} phiếu.`}
        </p>
        {!loadingConfirmed && rows.length === 0 ? (
          <Alert type="info" showIcon title="Chưa có phiếu trong khoảng này." />
        ) : (
          !loadingConfirmed && (
            <Heatmap
              rows={rows}
              unit={layer === "suspected" ? "tin báo" : "phiếu xác nhận"}
              onSelect={(zone) => navigate(`/tickets?zone_code=${encodeURIComponent(zone)}`)}
            />
          )
        )}
      </Card>
    </>
  );
}
