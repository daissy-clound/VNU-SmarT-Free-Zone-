import { Alert, Button, Card, Empty, Tag } from "antd";
import {
  statusLabels,
  type Ticket,
  type User,
} from "../../../../backend/src/contracts";
import { remaining } from "../components/TicketTable";
import type { DashboardData } from "../useDashboard";

export function Shift({
  data,
  user,
  onSelect,
}: {
  data: DashboardData;
  user: User;
  onSelect: (ticket: Ticket) => void;
}) {
  const mine = data.tickets.filter(
    (ticket) =>
      ticket.assignee_id === user.id &&
      ["assigned", "verifying"].includes(ticket.status),
  );
  return (
    <div className="shift-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">CÔNG VIỆC ĐƯỢC GIAO</div>
          <h1>Ca trực của tôi</h1>
          <p>{mine.length} phiếu được giao đang xử lý</p>
        </div>
      </div>
      <Alert
        type="info"
        showIcon
        title="Bạn có thể xem thông tin phiếu. Tính năng cập nhật xử lý sẽ được bổ sung sau."
      />
      {!mine.length && (
        <Card>
          <Empty description="Chưa có phiếu đang xử lý được giao cho bạn." />
        </Card>
      )}
      {mine.map((ticket) => (
        <Card key={ticket.code} className="shift-ticket">
          <div className="shift-ticket-head">
            <strong>{ticket.code}</strong>
            <Tag color="blue">{statusLabels[ticket.status]}</Tag>
          </div>
          <h2>{ticket.zone_code}</h2>
          <p>
            {data.zones.find((zone) => zone.code === ticket.zone_code)?.name}
          </p>
          <Tag>
            {ticket.presence === null
              ? "Hiện diện: không rõ"
              : ticket.presence
                ? "Có người tại chỗ"
                : "Không còn ai"}
          </Tag>
          <p className={remaining(ticket, data.now).overdue ? "overdue" : ""}>
            {remaining(ticket, data.now).text}
          </p>
          <Button block onClick={() => onSelect(ticket)}>
            Xem thông tin phiếu
          </Button>
        </Card>
      ))}
    </div>
  );
}
