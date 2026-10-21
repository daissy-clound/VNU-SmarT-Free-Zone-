import { Link } from "react-router-dom";
import {
  CheckCircleFilled,
  DisconnectOutlined,
  QuestionCircleOutlined,
  WarningFilled,
} from "@ant-design/icons";
import type { Zone } from "../../../../backend/src/contracts";

/** Trạng thái cảm biến: màu + biểu tượng + chữ (không phân biệt chỉ bằng màu) */
export const sensorStates = {
  suspected: { label: "Nghi vấn", icon: <WarningFilled />, className: "suspected" },
  offline: { label: "Mất kết nối", icon: <DisconnectOutlined />, className: "offline" },
  normal: { label: "Bình thường", icon: <CheckCircleFilled />, className: "normal" },
  unknown: { label: "Chưa có dữ liệu", icon: <QuestionCircleOutlined />, className: "unknown" },
} as const;

const order = ["suspected", "offline", "normal", "unknown"] as const;

export function SensorBoard({ zones }: { zones: Zone[] }) {
  const sensors = zones
    .filter((z) => z.sensor_id)
    .sort((a, b) => order.indexOf(a.sensor_state) - order.indexOf(b.sensor_state) || a.code.localeCompare(b.code));
  const counts = order.map((s) => [s, sensors.filter((z) => z.sensor_state === s).length] as const);
  return (
    <div className="sensor-board">
      <div className="sensor-summary" aria-label="Tóm tắt trạng thái cảm biến">
        {counts
          .filter(([, n]) => n > 0)
          .map(([s, n]) => (
            <span key={s} className={`sensor-pill ${sensorStates[s].className}`}>
              <span aria-hidden>{sensorStates[s].icon}</span> {n} {sensorStates[s].label.toLowerCase()}
            </span>
          ))}
      </div>
      <ul className="sensor-grid">
        {sensors.map((z) => {
          const st = sensorStates[z.sensor_state];
          return (
            <li key={z.code}>
              <Link
                to={`/floors?zone=${encodeURIComponent(z.code)}`}
                className={`sensor-tile ${st.className}`}
                aria-label={`${z.code}, ${z.name}: ${st.label}${z.presence ? ", có người tại chỗ" : ""}`}
              >
                <span className="sensor-tile-head">
                  <strong>{z.code}</strong>
                  <span aria-hidden>{st.icon}</span>
                </span>
                <span className="sensor-tile-name">{z.name}</span>
                <span className="sensor-tile-state">
                  {st.label}
                  {z.presence ? " · có người" : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
