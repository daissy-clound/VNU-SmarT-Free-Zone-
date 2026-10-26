import {
  ArrowRightOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  EnvironmentOutlined,
  PictureOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Button, Card } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Ticket, User } from "../../../../backend/src/contracts";
import { api } from "../api";
import { TicketTable } from "../components/TicketTable";
import { SensorBoard } from "../components/SensorBoard";
import { SandboxPanel } from "../components/SandboxPanel";
import type { DashboardData } from "../useDashboard";

type Infographic = { id: string; title: string; image_url: string; building: string | null; created_at: string };

function imageLoads(src: string) {
  return new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 1);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

/** Infographic mới nhất do BQL đăng (API công khai); null khi chưa có hoặc máy chủ chưa sẵn sàng */
function useLatestInfographic() {
  const [item, setItem] = useState<Infographic | null>(null);
  useEffect(() => {
    let alive = true;
    api
      .infographics()
      .then(async (res: { items?: Infographic[] }) => {
        for (const info of res.items ?? []) {
          if (await imageLoads(info.image_url)) return alive && setItem(info);
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return item;
}

export function Overview({
  data,
  user,
  token,
  onSelect,
}: {
  data: DashboardData;
  user: User;
  token: string;
  onSelect: (ticket: Ticket) => void;
}) {
  const active = data.tickets.filter((ticket) =>
    ["received", "assigned", "verifying"].includes(ticket.status),
  );
  const overdue = active.filter(
    (ticket) => ticket.due_at && Date.parse(ticket.due_at) < data.now,
  );
  const complete = data.tickets.length - active.length;
  const startOfDay = new Date(data.now).setHours(0, 0, 0, 0);
  const today = data.tickets.filter((t) => Date.parse(t.created_at) >= startOfDay);
  const sensors = data.zones.filter((zone) => zone.sensor_id);
  const sensorsOk = sensors.filter((zone) => zone.sensor_state === "normal" || zone.sensor_state === "suspected");
  const suspected = sensors.filter((zone) => zone.sensor_state === "suspected");
  const toDispatch = data.tickets.filter(
    (t) => t.status === "received" && !t.is_sandbox && !data.dispatches.some((d) => d.ticket_code === t.code),
  );
  const latestInfographic = useLatestInfographic();
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Tổng quan</h1>
        </div>
        <Link to="/tickets">
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            iconPlacement="end"
          >
            Xem danh sách phiếu
          </Button>
        </Link>
      </div>
      {user.role === "viewer" && <SandboxPanel data={data} token={token} />}
      {user.role === "manager" && !data.loading && data.lastSync && toDispatch.length > 0 && (
        <div className="attention-banner dispatch-banner">
          <SendOutlined aria-hidden />
          <div>
            <strong>{toDispatch.length} phiếu mới chờ điều phối</strong>
          </div>
          <Link to="/dispatch">
            <Button type="primary">
              Mở điều phối <ArrowRightOutlined aria-hidden />
            </Button>
          </Link>
        </div>
      )}
      {!data.loading && data.lastSync && overdue.length > 0 && (
        <div className="attention-banner">
          <ClockCircleOutlined aria-hidden />
          <div>
            <strong>{overdue.length} phiếu đã quá hạn</strong>
          </div>
          <Link to="/tickets?scope=overdue">
            <Button>
              Xem phiếu quá hạn <ArrowRightOutlined aria-hidden />
            </Button>
          </Link>
        </div>
      )}
      <div className="stat-grid">
        {[
          {
            label: "Phiếu đang xử lý",
            value: active.length,
            icon: <FileTextOutlined />,
            note: "Tiếp nhận → xác minh",
            style: "green",
            href: "/tickets?scope=open",
          },
          {
            label: "Cần chú ý thời hạn",
            value: overdue.length,
            icon: <ClockCircleOutlined />,
            note: "Phiếu đã quá hạn",
            style: "amber",
            href: "/tickets?scope=overdue",
          },
          {
            label: "Phiếu mới hôm nay",
            value: today.length,
            icon: <SafetyCertificateOutlined />,
            note: `${today.filter((t) => t.source === "sensor" || t.source === "both").length} từ cảm biến · ${complete} đã hoàn tất (tổng)`,
            style: "blue",
            href: "/tickets",
          },
          {
            label: "Cảm biến hoạt động",
            value: `${sensorsOk.length}/${sensors.length}`,
            icon: <EnvironmentOutlined />,
            note: suspected.length ? `${suspected.length} điểm đang nghi vấn có khói` : "Không có điểm nghi vấn",
            style: suspected.length ? "amber" : "green",
            href: "/floors",
          },
        ].map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="stat-link"
            aria-label={`Xem ${item.label.toLowerCase()}`}
          >
            <Card className="stat-card">
              <div className="stat-top">
                <span>{item.label}</span>
                <span className={`stat-icon ${item.style}`}>{item.icon}</span>
              </div>
              <div className="stat-number">
                {data.loading || !data.lastSync ? "—" : item.value}
              </div>
              <div className="muted">{item.note}</div>
            </Card>
          </Link>
        ))}
      </div>
      <Card
        className="sensor-card"
        title="Trạng thái cảm biến"
        extra={<Link to="/floors">Xem sơ đồ tầng →</Link>}
      >
        <SensorBoard zones={data.zones} />
      </Card>
      <div className="overview-grid">
        <Card
          title="Phiếu mới nhất"
          extra={<Link to="/tickets">Xem tất cả →</Link>}
          className="recent-card"
        >
          <TicketTable {...data} onSelect={onSelect} compact />
        </Card>
        <Card
          className="infographic-card"
          title="Infographic"
          extra={user.role === "manager" && <Link to="/analytics?tab=infographics">Đăng mới →</Link>}
        >
          {latestInfographic ? (
            <figure className="infographic-frame">
              <img src={latestInfographic.image_url} alt={latestInfographic.title} />
              <figcaption>
                {latestInfographic.title}
                <span>
                  {latestInfographic.building || "Toàn trường"} ·{" "}
                  {new Date(latestInfographic.created_at).toLocaleDateString("vi-VN")}
                </span>
              </figcaption>
            </figure>
          ) : (
            <div className="infographic-placeholder">
              <PictureOutlined />
              <span>Chưa có infographic</span>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
