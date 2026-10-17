import React from "react";
import type { Zone } from "../../../../backend/src/contracts";

const stateColors = {
  normal: "#25816b",
  suspected: "#d97706",
  offline: "#64748b",
  unknown: "#94a3b8",
};
const stateLabels = {
  normal: "Bình thường",
  suspected: "Nghi vấn",
  offline: "Mất kết nối",
  unknown: "Chưa có dữ liệu",
};
export function FloorMap({
  zones,
  building,
  floor,
  selected,
  onSelect,
}: {
  zones: Zone[];
  building: string;
  floor: number;
  selected?: string;
  onSelect: (zone: Zone) => void;
}) {
  return (
    <svg
      className="floor-svg"
      viewBox="0 0 1000 560"
      fontFamily="Segoe UI, Arial, sans-serif"
      role="group"
      aria-label={`Sơ đồ toà ${building}, tầng ${floor}`}
    >
      <rect
        x="35"
        y="75"
        width="930"
        height="410"
        rx="12"
        fill="#f7f9f8"
        stroke="#b9c9c3"
        strokeWidth="3"
      />
      <path
        d="M175 75V485 M825 75V485 M175 230H825 M175 330H825 M375 75V230 M625 75V230 M375 330V485 M625 330V485"
        fill="none"
        stroke="#cad5d0"
        strokeWidth="3"
      />
      <rect x="177" y="233" width="646" height="94" fill="#e6efeb" />
      <g fill="#82938d" fontSize="16" textAnchor="middle">
        <text x="275" y="110">
          Khu vực chung
        </text>
        <text x="500" y="110">
          Phòng ở
        </text>
        <text x="725" y="110">
          Khu vực chung
        </text>
        <text x="275" y="470">
          Phòng ở / tiện ích
        </text>
        <text x="500" y="470">
          Phòng ở
        </text>
        <text x="725" y="470">
          Phòng ở / tiện ích
        </text>
        <text x="105" y="210">
          Thang Tây
        </text>
        <text x="895" y="210">
          Thang Đông
        </text>
        <text x="385" y="260">
          HÀNH LANG
        </text>
      </g>
      <text x="35" y="35" fill="#183f36" fontSize="22" fontWeight="700">
        TOÀ {building} / TẦNG {floor}
      </text>
      <text x="965" y="35" textAnchor="end" fill="#687c73" fontSize="15">
        Sơ đồ quy ước · không theo tỷ lệ
      </text>
      {zones
        .filter((zone) => zone.building === building && zone.floor === floor)
        .map((zone) => (
          <g key={zone.code}>
            {selected === zone.code && (
              <rect
                x={zone.x - 33}
                y={zone.y - 35}
                width="115"
                height="84"
                rx="12"
                fill="#e0f0e9"
                stroke="#17634c"
                strokeDasharray="4 3"
              />
            )}
            {zone.sensor_id && (
              <g
                id={`sensor-${zone.sensor_id}`}
                data-zone-code={zone.code}
                data-state={zone.sensor_state}
                role="button"
                tabIndex={0}
                aria-label={`Cảm biến ${zone.sensor_id}: ${stateLabels[zone.sensor_state]}`}
                onClick={() => onSelect(zone)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(zone);
                  }
                }}
              >
                <title>{`${zone.sensor_id} · ${stateLabels[zone.sensor_state]}`}</title>
                <circle
                  cx={zone.x}
                  cy={zone.y}
                  r="21"
                  fill={stateColors[zone.sensor_state]}
                  stroke="white"
                  strokeWidth="4"
                />
                <path
                  d={`M${zone.x - 10} ${zone.y}h5l4 -7 4 14 4 -7h4`}
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                />
              </g>
            )}
            <g
              id={zone.qr_id}
              data-zone-code={zone.code}
              role="button"
              tabIndex={0}
              aria-label={`Điểm QR ${zone.code}`}
              onClick={() => onSelect(zone)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(zone);
                }
              }}
            >
              <title>{`${zone.qr_id} · Ký hiệu vị trí, không phải mã để quét`}</title>
              <rect
                x={zone.x + 29}
                y={zone.y - 18}
                width="36"
                height="36"
                rx="5"
                fill="white"
                stroke="#284b40"
                strokeWidth="2"
              />
              <path
                d={`M${zone.x + 35} ${zone.y - 12}h8v8h-8z M${zone.x + 51} ${zone.y - 12}h8v8h-8z M${zone.x + 35} ${zone.y + 4}h8v8h-8z M${zone.x + 51} ${zone.y + 4}h8v8h-8z`}
                fill="#284b40"
              />
            </g>
            {zone.sensor_id && (
              <g
                id={`presence-${zone.sensor_id}`}
                aria-label={
                  zone.presence === null
                    ? "Hiện diện: không rõ"
                    : zone.presence
                      ? "Có người tại chỗ"
                      : "Không còn ai"
                }
              >
                <circle
                  cx={zone.x}
                  cy={zone.y - 43}
                  r="12"
                  fill={
                    zone.presence === null
                      ? "#e5e7eb"
                      : zone.presence
                        ? "#cae9dd"
                        : "#f1f5f3"
                  }
                />
                {zone.presence === null ? (
                  <text
                    x={zone.x}
                    y={zone.y - 38}
                    textAnchor="middle"
                    fontSize="15"
                    fill="#475569"
                  >
                    ?
                  </text>
                ) : (
                  <g stroke="#245340" strokeWidth="2" fill="none">
                    <circle cx={zone.x} cy={zone.y - 47} r="3" />
                    <path
                      d={`M${zone.x - 6} ${zone.y - 36}q0 -10 6 -10q6 0 6 10`}
                    />
                    {!zone.presence && (
                      <path d={`M${zone.x - 7} ${zone.y - 50}l14 14`} />
                    )}
                  </g>
                )}
              </g>
            )}
            <text
              x={zone.x + 16}
              y={zone.y + 38}
              textAnchor="middle"
              fill="#173e34"
              fontSize="15"
              fontWeight="600"
            >
              {zone.code}
            </text>
          </g>
        ))}
      <text x="35" y="535" fill="#687c73" fontSize="15">
        ● Cảm biến ▣ Điểm QR ? Hiện diện chưa rõ
      </text>
    </svg>
  );
}
