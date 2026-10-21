import { useEffect, useMemo, useRef, useState } from "react";
import type { Telemetry } from "../../../../backend/src/contracts";

/** Ngưỡng nghi vấn PM2.5 mà bộ phát hiện tầng 1 của A đang dùng */
export const PM25_THRESHOLD = 35;

const H = 200;
const PAD = { top: 16, right: 16, bottom: 30, left: 44 };
const LINE = "#256abf";

const timeFmt = (iso: string) =>
  new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/**
 * Biểu đồ bụi mịn PM2.5 quanh thời điểm sự việc: một chuỗi, một trục,
 * đường ngưỡng nét đứt, tooltip theo con trỏ / chạm. Bảng số liệu đi kèm cho trình đọc màn hình.
 */
export function DustChart({ items }: { items: Telemetry[] }) {
  const [hover, setHover] = useState<number | null>(null);
  // Vẽ theo đúng bề rộng thật để chữ trục luôn ~11px dù thẻ hẹp hay rộng
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(480);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length >= 2]);
  const points = useMemo(
    () => [...items].sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts)),
    [items],
  );
  if (points.length < 2) return null;

  const t0 = Date.parse(points[0].ts);
  const t1 = Date.parse(points[points.length - 1].ts);
  const maxY = Math.max(PM25_THRESHOLD * 1.5, ...points.map((p) => p.pm25)) * 1.1;
  const x = (iso: string) =>
    PAD.left + ((Date.parse(iso) - t0) / Math.max(1, t1 - t0)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - v / maxY) * (H - PAD.top - PAD.bottom);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(p.ts).toFixed(1)},${y(p.pm25).toFixed(1)}`).join(" ");
  const ticks = [0, maxY / 2, maxY].map((v) => Math.round(v));
  const peak = points.reduce((m, p) => (p.pm25 > m.pm25 ? p : m), points[0]);
  const active = hover === null ? null : points[hover];

  const pick = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(x(p.ts) - px) < Math.abs(x(points[best].ts) - px)) best = i;
    });
    setHover(best);
  };

  return (
    <figure className="dust-chart">
      <div className="dust-plot" ref={box}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`PM2.5 từ ${timeFmt(points[0].ts)} đến ${timeFmt(points[points.length - 1].ts)}, cao nhất ${peak.pm25} µg/m³ lúc ${timeFmt(peak.ts)}`}
          onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="grid" />
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="axis">
                {t}
              </text>
            </g>
          ))}
          <line x1={PAD.left} x2={W - PAD.right} y1={y(PM25_THRESHOLD)} y2={y(PM25_THRESHOLD)} className="threshold" />
          <text x={PAD.left + 6} y={y(PM25_THRESHOLD) - 6} className="axis">
            Ngưỡng nghi vấn {PM25_THRESHOLD}
          </text>
          <text x={PAD.left} y={H - 8} className="axis">
            {timeFmt(points[0].ts)}
          </text>
          <text x={W - PAD.right} y={H - 8} textAnchor="end" className="axis">
            {timeFmt(points[points.length - 1].ts)}
          </text>
          <path d={path} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(peak.ts)} cy={y(peak.pm25)} r={4} fill={LINE} stroke="#fff" strokeWidth={2} />
          {active && (
            <g>
              <line x1={x(active.ts)} x2={x(active.ts)} y1={PAD.top} y2={H - PAD.bottom} className="crosshair" />
              <circle cx={x(active.ts)} cy={y(active.pm25)} r={5} fill={LINE} stroke="#fff" strokeWidth={2} />
            </g>
          )}
        </svg>
        {active && (
          <div
            className="chart-tooltip"
            style={{ left: `${(x(active.ts) / W) * 100}%`, top: `${(y(active.pm25) / H) * 100}%` }}
            role="status"
          >
            <strong>{active.pm25} µg/m³</strong>
            <span>{timeFmt(active.ts)}</span>
            <span>
              {active.presence === null ? "Hiện diện: không rõ" : active.presence ? "Có người tại chỗ" : "Không có người"}
            </span>
          </div>
        )}
      </div>
      <figcaption className="muted">
        PM2.5 (µg/m³) · cao nhất <strong>{peak.pm25}</strong> lúc {timeFmt(peak.ts)}
        {peak.pm25 >= PM25_THRESHOLD ? " · vượt ngưỡng nghi vấn" : ""}
      </figcaption>
      <table className="visually-hidden">
        <caption>Số liệu PM2.5</caption>
        <thead>
          <tr>
            <th>Thời điểm</th>
            <th>PM2.5</th>
            <th>Hiện diện</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.seq + p.ts}>
              <td>{timeFmt(p.ts)}</td>
              <td>{p.pm25}</td>
              <td>{p.presence === null ? "Không rõ" : p.presence ? "Có" : "Không"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
