import { useState } from "react";
import { Button, Card, Empty, Segmented, Select, Tag } from "antd";
import { Link, useSearchParams } from "react-router-dom";
import { FloorMap } from "../components/FloorMap";
import type { DashboardData } from "../useDashboard";

const buildingOptions = [
  { label: "Khuôn viên", value: "CONG" },
  { label: "UET1", value: "UET1" },
  { label: "UET2", value: "UET2" },
  { label: "UET3", value: "UET3" },
  { label: "UET4", value: "UET4" },
  { label: "Nhà ĐN", value: "DN" },
];

const buildingMaxFloors: Record<string, number> = {
  UET1: 5,
  UET2: 5,
  UET3: 5,
  UET4: 4,
  DN: 2,
  CONG: 1,
};

export function Floors({ data }: { data: DashboardData }) {
  const [params, setParams] = useSearchParams();
  const [chosenBuilding, setBuilding] = useState("CONG");
  const [chosenFloor, setFloor] = useState(1);
  const selected = params.get("zone") || undefined;
  const zone = data.zones.find((item) => item.code === selected);
  const building = zone?.building || chosenBuilding;
  const maxFloor = buildingMaxFloors[building] || 5;
  const floor = Math.min(zone?.floor || chosenFloor, maxFloor);

  const setSelected = (code?: string) => {
    const next = data.zones.find((item) => item.code === code);
    if (next) {
      setBuilding(next.building);
      setFloor(next.floor);
    }
    setParams(code ? { zone: code } : {}, { replace: true });
  };
  /** Bấm toà trên mặt bằng khuôn viên: mở thẳng điểm đang nghi vấn nếu có, không thì tầng 1 */
  const openBuilding = (code: string) => {
    const hot = data.zones.find((item) => item.building === code && item.sensor_state === "suspected");
    if (hot) return setSelected(hot.code);
    setBuilding(code);
    setFloor(1);
    setSelected(undefined);
  };
  const campus = building === "CONG";
  const floorZones = data.zones.filter(
    (item) => item.building === building && item.floor === floor,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Sơ đồ mặt bằng &amp; tầng</h1>
        </div>
      </div>
      <div className="map-controls">
        <label className="filter-field map-search">
          <span>Tìm nhanh khu vực</span>
          <Select
            aria-label="Tìm khu vực trên sơ đồ"
            showSearch
            allowClear
            optionFilterProp="label"
            placeholder="Tên hoặc mã khu vực…"
            value={selected}
            onChange={setSelected}
            options={data.zones.map((item) => ({
              value: item.code,
              label: `${item.code} · ${item.name}`,
            }))}
          />
        </label>
        <Segmented
          aria-label="Chọn toà"
          options={buildingOptions}
          value={building}
          onChange={(value) => {
            const nextB = String(value);
            setBuilding(nextB);
            const nextMax = buildingMaxFloors[nextB] || 5;
            setFloor((prev) => Math.min(prev, nextMax));
            setSelected(undefined);
          }}
        />
        <Select
          aria-label="Chọn tầng"
          value={floor}
          onChange={(value) => {
            setFloor(value);
            setBuilding(building);
            setSelected(undefined);
          }}
          style={{ width: 170 }}
          options={Array.from({ length: maxFloor }, (_, index) => ({
            value: index + 1,
            label: building === "CONG" ? "Mặt bằng khuôn viên" : `Tầng ${index + 1}`,
          }))}
        />
      </div>
      <div className="map-grid">
        <Card className="map-card">
          <div className="floor-point-list" aria-label="Khu vực trên tầng">
            <strong>{campus ? "Mặt bằng khuôn viên" : `Toà ${building} · Tầng ${floor}`}</strong>
            <span className="muted">
              {campus ? "Bấm vào toà nhà để mở sơ đồ tầng" : `${floorZones.length} khu vực`}
            </span>
            <div>
              {floorZones.map((item) => (
                <Button
                  key={item.code}
                  type={selected === item.code ? "primary" : "default"}
                  aria-pressed={selected === item.code}
                  onClick={() => setSelected(item.code)}
                >
                  {item.name}
                </Button>
              ))}
            </div>
          </div>
          <FloorMap
            zones={data.zones}
            building={building}
            floor={floor}
            selected={selected}
            onSelect={(zone) => setSelected(zone.code)}
            onSelectBuilding={openBuilding}
          />
          {campus ? (
            <div className="map-legend">
              <Tag color="green">Toà ổn định</Tag>
              <Tag color="orange">Toà có điểm nghi vấn</Tag>
              <Tag>Cổng / chốt bảo vệ</Tag>
            </div>
          ) : (
            <div className="map-legend">
              <Tag color="green">Bình thường</Tag>
              <Tag color="orange">Nghi vấn</Tag>
              <Tag>Mất kết nối / chưa rõ</Tag>
              <span>QR là ký hiệu vị trí, không phải mã để quét.</span>
            </div>
          )}
        </Card>
        <Card title="Thông tin khu vực">
          {zone ? (
            <div className="zone-info">
              <Tag color="green">{zone.code}</Tag>
              <h2>{zone.name}</h2>
              <p>
                {zone.building === "CONG" ? "Cổng trường" : `Toà ${zone.building} · Tầng ${zone.floor}`}
              </p>
              <dl>
                <dt>Cảm biến</dt>
                <dd>{zone.sensor_id || "Không đặt cảm biến"}</dd>
                <dt>Điểm QR</dt>
                <dd>{zone.qr_id}</dd>
                <dt>Hiện diện</dt>
                <dd>
                  {zone.presence === null
                    ? "Không rõ"
                    : zone.presence
                      ? "Có người tại chỗ"
                      : "Không còn ai"}
                </dd>
              </dl>
              <Link to={`/tickets?zone_code=${encodeURIComponent(zone.code)}`}>
                <Button block type="primary">
                  Xem phiếu khu vực này
                </Button>
              </Link>
            </div>
          ) : (
            <Empty description={campus ? "Chọn một toà nhà hoặc cổng trên sơ đồ" : "Chọn một điểm trên sơ đồ"} />
          )}
        </Card>
      </div>
    </>
  );
}
