import { useState } from "react";
import { Alert, Button, Card, Empty, Segmented, Select, Tag } from "antd";
import { Link, useSearchParams } from "react-router-dom";
import { FloorMap } from "../components/FloorMap";
import type { DashboardData } from "../useDashboard";

export function Floors({ data }: { data: DashboardData }) {
  const [params, setParams] = useSearchParams();
  const [chosenBuilding, setBuilding] = useState("B");
  const [chosenFloor, setFloor] = useState(5);
  const selected = params.get("zone") || undefined;
  const zone = data.zones.find((item) => item.code === selected);
  const building = zone?.building || chosenBuilding;
  const floor = zone?.floor || chosenFloor;
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
          <div className="eyebrow">KHÔNG GIAN KTX</div>
          <h1>Sơ đồ tầng</h1>
          <p>Chọn một cảm biến hoặc điểm QR để xem khu vực.</p>
        </div>
        <Tag>2 toà · 6 tầng / toà</Tag>
      </div>
      {data.provisional && (
        <Alert
          type="warning"
          showIcon
          title="Sơ đồ minh hoạ: vị trí thực tế đang được xác nhận."
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
          options={[
            { label: "Toà A", value: "A" },
            { label: "Toà B", value: "B" },
          ]}
          value={building}
          onChange={(value) => {
            setBuilding(value);
            setFloor(floor);
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
          style={{ width: 130 }}
          options={Array.from({ length: 6 }, (_, index) => ({
            value: index + 1,
            label: `Tầng ${index + 1}`,
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
