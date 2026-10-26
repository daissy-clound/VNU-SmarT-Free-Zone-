import type { KeyboardEvent } from "react";
import type { Zone } from "../../../../backend/src/contracts";
import { CAMPUS_BUILDINGS, CAMPUS_GATES, CAMPUS_SIZE, DN_DETAIL, type CampusBuilding } from "./campusPlan";

type BuildingStatus = "suspected" | "offline" | "normal" | "none";

const statusDot: Record<BuildingStatus, string> = {
  suspected: "#ea580c",
  offline: "#64748b",
  normal: "#16a34a",
  none: "#94a3b8",
};

function summarize(zones: Zone[], code: string) {
  const sensors = zones.filter((z) => z.building === code && z.sensor_id);
  const suspected = sensors.filter((z) => z.sensor_state === "suspected").length;
  const offline = sensors.filter((z) => z.sensor_state === "offline").length;
  const status: BuildingStatus = !sensors.length
    ? "none"
    : suspected
      ? "suspected"
      : offline === sensors.length
        ? "offline"
        : "normal";
  const text = !sensors.length
    ? "Chưa đặt cảm biến"
    : suspected
      ? `${suspected} nghi vấn`
      : offline
        ? `${offline}/${sensors.length} mất kết nối`
        : `${sensors.length} cảm biến · ổn`;
  return { sensors: sensors.length, suspected, status, text };
}

const activate = (fn: () => void) => (event: KeyboardEvent) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fn();
  }
};

function StatusBadge({ x, y, status, text }: { x: number; y: number; status: BuildingStatus; text: string }) {
  const width = text.length * 6.4 + 26;
  return (
    <g className="campus-badge" transform={`translate(${x - width / 2} ${y})`} aria-hidden="true">
      <rect width={width} height="20" rx="10" fill="#ffffff" stroke="#1b1b1b" strokeOpacity="0.18" />
      {status === "suspected" ? (
        <path d="M13 4.5 L19 15.5 H7 Z" fill={statusDot.suspected} />
      ) : (
        <circle cx="13" cy="10" r="5" fill={statusDot[status]} />
      )}
      <text x="23" y="14.2" fontSize="11.5" fontWeight="600" fill="#1f2a24">
        {text}
      </text>
    </g>
  );
}

function BuildingShape({
  building,
  zones,
  onOpen,
}: {
  building: CampusBuilding;
  zones: Zone[];
  onOpen: (code: string) => void;
}) {
  const info = summarize(zones, building.code);
  const open = () => onOpen(building.code);
  return (
    <g
      id={`campus-${building.code}`}
      className={`campus-building ${info.status}`}
      role="button"
      tabIndex={0}
      aria-label={`${building.name}, ${building.floors} tầng: ${info.text}. Mở sơ đồ tầng`}
      onClick={open}
      onKeyDown={activate(open)}
    >
      <title>{`${building.name} · ${building.floors} tầng · ${info.text}`}</title>
      <path className="campus-outline" d={building.d} fillRule="evenodd" />
      {building.code === "DN" && (
        <g>
          <path d={DN_DETAIL.halls} fill="#a2a2a2" fillRule="evenodd" />
          <path d={DN_DETAIL.ring} fill="#8d94a6" fillRule="evenodd" />
          <path d={DN_DETAIL.dome} fill="#dbdee3" fillRule="evenodd" />
        </g>
      )}
      <text className="campus-label" x={building.label.x} y={building.label.y + 6} textAnchor="middle">
        {building.code === "DN" ? "ĐN" : building.code}
      </text>
      <StatusBadge x={building.label.x} y={building.label.y + 14} status={info.status} text={info.text} />
    </g>
  );
}

/** Mặt bằng khuôn viên UET Hoà Lạc: toà nhà bấm được (mở sơ đồ tầng), trạng thái cảm biến theo toà, các cổng. */
export function CampusMap({
  zones,
  selected,
  onSelect,
  onSelectBuilding,
}: {
  zones: Zone[];
  selected?: string;
  onSelect: (zone: Zone) => void;
  onSelectBuilding?: (code: string) => void;
}) {
  const gates = zones.filter((z) => z.building === "CONG");
  return (
    <svg
      className="floor-svg campus-svg"
      viewBox={`0 0 ${CAMPUS_SIZE.width} ${CAMPUS_SIZE.height}`}
      fontFamily="Segoe UI, Roboto, Helvetica, Arial, sans-serif"
      role="group"
      aria-label="Mặt bằng khuôn viên UET Hoà Lạc"
    >
      <image href="/maps/uet-campus-base.svg" pointerEvents="none" width={CAMPUS_SIZE.width} height={CAMPUS_SIZE.height} />
      {CAMPUS_BUILDINGS.map((b) => (
        <BuildingShape key={b.code} building={b} zones={zones} onOpen={(code) => onSelectBuilding?.(code)} />
      ))}
      {gates.map((zone) => {
        const at = CAMPUS_GATES[zone.code];
        if (!at) return null;
        const pick = () => onSelect(zone);
        return (
          <g
            key={zone.code}
            id={zone.qr_id}
            className={`campus-gate${selected === zone.code ? " selected" : ""}`}
            data-zone-code={zone.code}
            role="button"
            tabIndex={0}
            aria-label={`${zone.name}${at.provisional ? " (vị trí tạm)" : ""}`}
            aria-pressed={selected === zone.code}
            onClick={pick}
            onKeyDown={activate(pick)}
            transform={`translate(${at.x} ${at.y})`}
          >
            <title>{`${zone.name} · điểm QR ${zone.qr_id}${at.provisional ? " · vị trí tạm, chờ xác nhận" : ""}`}</title>
            {selected === zone.code && <circle r="24" fill="#dcfce7" stroke="#15803d" strokeWidth="2" strokeDasharray="4 3" />}
            <rect x="-14" y="-14" width="28" height="28" rx="5" fill="#ffffff" stroke="#1b1b1b" strokeWidth="1.6" strokeDasharray={at.provisional ? "3 2" : undefined} />
            {/* chốt bảo vệ: mái + người */}
            <path d="M-10 -8 H10 M-8 -8 V9 M8 -8 V9 M-10 9 H10" stroke="#1b1b1b" strokeWidth="1.6" fill="none" />
            <circle cx="0" cy="-2" r="2.6" fill="none" stroke="#1b1b1b" strokeWidth="1.4" />
            <path d="M-4.5 6 q0 -4.5 4.5 -4.5 q4.5 0 4.5 4.5" fill="none" stroke="#1b1b1b" strokeWidth="1.4" />
            <text className="campus-gate-label" y="29" textAnchor="middle">
              {zone.code.replace("CONG-", "Cổng ")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
