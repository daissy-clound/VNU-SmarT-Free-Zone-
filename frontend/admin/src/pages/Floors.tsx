import { useState } from "react";
import { Alert, Button, Card, Empty, Segmented, Select, Tag } from "antd";
import { Link, useSearchParams } from "react-router-dom";
import { FloorMap } from "../components/FloorMap";
import type { DashboardData } from "../useDashboard";

const buildingOptions = [
  { label: "UET1", value: "UET1" },
  { label: "UET2", value: "UET2" },
  { label: "UET3", value: "UET3" },
  { label: "UET4", value: "UET4" },
  { label: "Nhà ĐN", value: "DN" },
  { label: "Khuôn viên", value: "CONG" },
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
  const [chosenBuilding, setBuilding] = useState("UET1");
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
  const floorZones = data.zones.filter(
    (item) => item.building === building && item.floor === floor,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">KHUÔN VIÊN ĐẠI HỌC CÔNG NGHỆ (UET) — ĐHQGHN TẠI HOÀ LẠC</div>
          <h1>Sơ đồ mặt bằng &amp; tầng</h1>
          <p>Sơ đồ kiến trúc thực tế các toà nhà UET1-4, Nhà đa năng, hồ nước trung tâm và 3 cổng trường.</p>
        </div>
        <Tag color="blue">Khuôn viên UET Hoà Lạc · 5 toà nhà + 3 cổng</Tag>
      </div>
      {data.provisional && (
        <Alert
          type="info"
          showIcon
          title="Sơ đồ kiến trúc thực tế khuôn viên UET Hoà Lạc theo bản vẽ quy hoạch."
        />
      )}
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
            <strong>
              Toà {building} · Tầng {floor}
            </strong>
            <span className="muted">{floorZones.length} khu vực</span>
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
          />
          <div className="map-legend">
            <Tag color="green">Bình thường</Tag>
            <Tag color="orange">Nghi vấn</Tag>
            <Tag>Mất kết nối / chưa rõ</Tag>
            <span>QR là ký hiệu vị trí, không phải mã để quét.</span>
          </div>
        </Card>
        <Card title="Thông tin khu vực">
          {zone ? (
            <div className="zone-info">
              <Tag color="green">{zone.code}</Tag>
              <h2>{zone.name}</h2>
              <p>
                Toà {zone.building} · Tầng {zone.floor}
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
              <p className="muted">
                Hiện diện chỉ đo có/không có người; không nhận dạng và không
                dùng làm bằng chứng vi phạm.
              </p>
              <Link to={`/tickets?zone_code=${encodeURIComponent(zone.code)}`}>
                <Button block type="primary">
                  Xem phiếu khu vực này
                </Button>
              </Link>
            </div>
          ) : (
            <Empty description="Chọn một điểm trên sơ đồ" />
          )}
        </Card>
      </div>
    </>
  );
}
