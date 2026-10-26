import { useState } from "react";

/** Thang tuần tự một sắc độ (xanh lam 150 → 700), từ bộ màu đã kiểm định */
const RAMP = ["#b7d3f6", "#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#104281", "#0d366b"];
const EMPTY = "#f1f4f2";

export function colorFor(value: number, max: number) {
  if (!value || !max) return EMPTY;
  const idx = Math.min(RAMP.length - 1, Math.floor((value / max) * (RAMP.length - 1) + 0.0001));
  return RAMP[Math.max(0, idx)];
}

/** Chữ trên ô: trắng trên nền đậm, mực tối trên nền nhạt */
const inkFor = (bg: string) => (RAMP.indexOf(bg) >= 3 ? "#ffffff" : "#16302a");

export interface HeatRow {
  code: string;
  label: string;
  counts: number[]; // 24 giờ
}

/**
 * Bản đồ nhiệt "khu vực × giờ trong ngày". Dựng bằng bảng HTML nên cũng chính là
 * dạng bảng cho trình đọc màn hình; mỗi ô có tooltip khi rê chuột / chạm / focus.
 */
export function Heatmap({ rows, unit, onSelect }: { rows: HeatRow[]; unit: string; onSelect?: (code: string, hour: number) => void }) {
  const [tip, setTip] = useState<{ row: HeatRow; hour: number } | null>(null);
  const max = Math.max(0, ...rows.flatMap((r) => r.counts));
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const legend = max ? Array.from(new Set(RAMP.map((_, i) => Math.max(1, Math.round(((i + 0.5) / RAMP.length) * max))))) : [];

  return (
    <div className="heatmap">
      <div className="heatmap-scroll">
        <table>
          <caption className="visually-hidden">
            Số {unit} theo khu vực và giờ trong ngày
          </caption>
          <thead>
            <tr>
              <th scope="col" className="heat-zone">
                Khu vực
              </th>
              {hours.map((h) => (
                <th scope="col" key={h} className="heat-hour">
                  {h % 3 === 0 ? `${h}h` : <span className="visually-hidden">{h}h</span>}
                </th>
              ))}
              <th scope="col" className="heat-total">
                Tổng
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const total = row.counts.reduce((a, b) => a + b, 0);
              return (
                <tr key={row.code}>
                  <th scope="row" className="heat-zone" title={row.label}>
                    <strong>{row.code}</strong>
                  </th>
                  {row.counts.map((v, h) => {
                    const bg = colorFor(v, max);
                    return (
                      <td
                        key={h}
                        tabIndex={v ? 0 : -1}
                        className={v ? "heat-cell has-value" : "heat-cell"}
                        style={{ background: bg, color: inkFor(bg) }}
                        aria-label={`${row.code}, ${h}:00–${h}:59: ${v} ${unit}`}
                        onPointerEnter={() => setTip({ row, hour: h })}
                        onPointerLeave={() => setTip(null)}
                        onFocus={() => setTip({ row, hour: h })}
                        onBlur={() => setTip(null)}
                        onClick={() => v && onSelect?.(row.code, h)}
                      >
                        {v || ""}
                      </td>
                    );
                  })}
                  <td className="heat-total">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="heat-footer">
        <div className="heat-tip" aria-live="polite">
          {tip ? (
            <>
              <strong>{tip.row.code}</strong> · {tip.row.label} · {tip.hour}:00–{tip.hour}:59 ·{" "}
              <strong>
                {tip.row.counts[tip.hour]} {unit}
              </strong>
            </>
          ) : (
            <span className="muted">Chạm vào ô để xem chi tiết</span>
          )}
        </div>
        {max > 0 && (
          <div className="heat-legend" aria-label={`Thang màu: nhạt là ít, đậm là nhiều, tối đa ${max}`}>
            <span className="muted">Ít</span>
            {legend.map((v) => (
              <span key={v} className="swatch" style={{ background: colorFor(v, max) }} title={`${v}`} />
            ))}
            <span className="muted">Nhiều (tối đa {max})</span>
          </div>
        )}
      </div>
    </div>
  );
}
