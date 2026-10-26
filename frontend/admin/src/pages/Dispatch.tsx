import { Card, Empty, Tag } from "antd";
import { Link } from "react-router-dom";
import {
  AlertOutlined,
  AuditOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  SendOutlined,
} from "@ant-design/icons";
import {
  priorityLabels,
  sourceLabels,
  statusLabels,
  type Ticket,
  type User,
} from "../../../../backend/src/contracts";
import { DispatchControl, dispatchOf, staffName } from "../components/DispatchControl";
import { remaining } from "../components/TicketTable";
import type { DashboardData } from "../useDashboard";

const priorityRank = { urgent: 0, high: 1, normal: 2, low: 3 } as const;
const priorityColor = { low: "default", normal: "blue", high: "orange", urgent: "red" } as const;
const sensorText = { normal: "bình thường", suspected: "đang nghi vấn", offline: "mất kết nối", unknown: "chưa có dữ liệu" };
const ago = (iso: string, now: number) => {
  const m = Math.floor((now - Date.parse(iso)) / 60000);
  return m < 1 ? "vừa xong" : m < 60 ? `${m} phút trước` : `${Math.floor(m / 60)} giờ trước`;
};

/** Thông tin để Ban quản lý xác minh nhanh trước khi điều phối */
function TicketFacts({ ticket, data }: { ticket: Ticket; data: DashboardData }) {
  const zone = data.zones.find((z) => z.code === ticket.zone_code);
  const deadline = remaining(ticket, data.now);
  return (
    <div className="dispatch-facts">
      <div className="dispatch-title">
        <Link to={`/tickets/${encodeURIComponent(ticket.code)}`}>
          <strong>{ticket.code}</strong>
        </Link>
        <Tag color={priorityColor[ticket.priority]}>{priorityLabels[ticket.priority]}</Tag>
        <Tag>{sourceLabels[ticket.source]}</Tag>
        <Tag color={ticket.presence ? "orange" : undefined}>
          {ticket.presence === null ? "Hiện diện không rõ" : ticket.presence ? "Có người tại chỗ" : "Không còn ai"}
        </Tag>
      </div>
      <h3>
        <EnvironmentOutlined aria-hidden /> {zone?.name ?? ticket.zone_code}
      </h3>
      <p className="muted small">
        {zone ? `Toà ${zone.building === "DN" ? "Nhà đa năng" : zone.building} · tầng ${zone.floor} · ` : ""}
        tiếp nhận {ago(ticket.created_at, data.now)} ·{" "}
        <span className={deadline.overdue ? "overdue" : ""}>hạn có mặt: {deadline.text.toLowerCase()}</span>
        {zone?.sensor_id ? ` · cảm biến ${zone.sensor_id} ${sensorText[zone.sensor_state]}` : " · khu vực chỉ có mã QR"}
      </p>
    </div>
  );
}

export function DispatchPage({ data, user, token }: { data: DashboardData; user: User; token: string }) {
  const received = data.tickets.filter((t) => t.status === "received" && !t.is_sandbox);
  const toDispatch = received
    .filter((t) => !dispatchOf(data, t.code))
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || a.created_at.localeCompare(b.created_at));
  const pending = received
    .map((t) => ({ t, d: dispatchOf(data, t.code)! }))
    .filter((x) => x.d)
    .map((x) => ({ ...x, late: Date.parse(x.d.accept_deadline) <= data.now }))
    .sort((a, b) => Number(b.late) - Number(a.late) || a.d.accept_deadline.localeCompare(b.d.accept_deadline));
  const late = pending.filter((x) => x.late);
  const checking = data.tickets.filter((t) => ["assigned", "verifying"].includes(t.status) && !t.is_sandbox);
  const rooms = data.rooms?.items ?? [];
  const ready = !data.loading && !!data.lastSync;

  return (
    <div className="dispatch-page">
      <div className="page-heading">
        <div>
          <h1>Điều phối phòng trực</h1>
        </div>
        {data.rooms && (
          <Tag color={data.rooms.in_office_hours ? "green" : "gold"}>
            {data.rooms.in_office_hours
              ? `Trong giờ hành chính (${data.rooms.office_hours_label})`
              : "Ngoài giờ hành chính · ưu tiên Phòng bảo vệ"}
          </Tag>
        )}
      </div>

      <div className="stat-grid">
        {[
          { label: "Cần xác minh & điều phối", value: toDispatch.length, icon: <AuditOutlined />, style: "blue", note: "Phiếu mới chưa giao" },
          { label: "Chờ phòng trực nhận", value: pending.length - late.length, icon: <SendOutlined />, style: "green", note: "Trong 3 phút" },
          { label: "Quá 3 phút chưa nhận", value: late.length, icon: <AlertOutlined />, style: late.length ? "amber" : "green", note: late.length ? "Gọi điện phòng trực" : "Không có" },
          { label: "Đang kiểm tra", value: checking.length, icon: <ClockCircleOutlined />, style: "green", note: "Đã nhận → đang xác minh" },
        ].map((item) => (
          <Card key={item.label} className="stat-card">
            <div className="stat-top">
              <span>{item.label}</span>
              <span className={`stat-icon ${item.style}`}>{item.icon}</span>
            </div>
            <div className="stat-number">{ready ? item.value : "—"}</div>
            <div className="muted">{item.note}</div>
          </Card>
        ))}
      </div>

      <div className="dispatch-grid">
        <div className="dispatch-main">
          <Card title={`Cần xác minh & điều phối (${toDispatch.length})`} className="dispatch-queue">
            {!toDispatch.length ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có phiếu mới chờ điều phối." />
            ) : (
              toDispatch.map((t) => (
                <div key={t.code} className="dispatch-item" data-ticket={t.code}>
                  <TicketFacts ticket={t} data={data} />
                  <DispatchControl
                    ticket={t}
                    zone={data.zones.find((z) => z.code === t.zone_code)}
                    data={data}
                    token={token}
                    user={user}
                  />
                </div>
              ))
            )}
          </Card>

          <Card title={`Chờ phòng trực nhận (${pending.length})`} className="dispatch-queue">
            {!pending.length ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có phiếu đang chờ nhận." />
            ) : (
              pending.map(({ t, late }) => (
                <div key={t.code} className={late ? "dispatch-item late" : "dispatch-item"} data-ticket={t.code}>
                  <TicketFacts ticket={t} data={data} />
                  <DispatchControl
                    ticket={t}
                    zone={data.zones.find((z) => z.code === t.zone_code)}
                    data={data}
                    token={token}
                    user={user}
                  />
                </div>
              ))
            )}
          </Card>

          <Card title={`Đang kiểm tra (${checking.length})`}>
            {!checking.length ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có phiếu đang kiểm tra." />
            ) : (
              <ul className="dispatch-checking">
                {checking.map((t) => {
                  const zone = data.zones.find((z) => z.code === t.zone_code);
                  const d = dispatchOf(data, t.code);
                  return (
                    <li key={t.code}>
                      <Link to={`/tickets/${encodeURIComponent(t.code)}`}>{t.code}</Link>
                      <span>{zone?.name ?? t.zone_code}</span>
                      <span className="muted">{staffName(data, t.assignee_id) ?? d?.accepted_by_name ?? "—"}</span>
                      <Tag color={t.status === "verifying" ? "blue" : "gold"}>{statusLabels[t.status]}</Tag>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="dispatch-side" aria-label="Phòng trực">
          {rooms.map((room) => (
            <Card key={room.id} size="small" className={room.on_duty ? "room-card" : "room-card off"}>
              <div className="room-head">
                <strong>{room.name}</strong>
                <Tag color={room.on_duty ? "green" : undefined}>
                  {room.hours === "24/7" ? "Trực 24/7" : room.on_duty ? "Đang trực" : "Ngoài giờ"}
                </Tag>
              </div>
              <p className="muted small">
                Phụ trách {room.buildings.map((b) => (b === "DN" ? "Nhà đa năng" : b === "CONG" ? "các cổng" : `toà ${b}`)).join(", ")} ·{" "}
                {room.location}
              </p>
              <p className="room-phone">
                {room.phone}
              </p>
              <ul className="room-staff">
                {room.staff.map((s) => (
                  <li key={s.id}>
                    <span className={s.active_tickets ? "dot busy" : "dot"} aria-hidden />
                    {s.name}
                    <span className="muted">{s.active_tickets ? `đang xử lý ${s.active_tickets} phiếu` : "rảnh"}</span>
                  </li>
                ))}
              </ul>
              {(room.waiting > 0 || room.in_progress > 0) && (
                <p className="small">
                  {room.waiting > 0 && <Tag color="gold">{room.waiting} chờ nhận</Tag>}
                  {room.in_progress > 0 && <Tag color="blue">{room.in_progress} đang kiểm tra</Tag>}
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
