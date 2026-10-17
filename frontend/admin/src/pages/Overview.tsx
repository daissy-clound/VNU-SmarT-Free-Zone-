import {
  ArrowRightOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  EnvironmentOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { Button, Card, Tag } from "antd";
import { Link } from "react-router-dom";
import type { Ticket, User } from "../../../../backend/src/contracts";
import { TicketTable } from "../components/TicketTable";
import type { DashboardData } from "../useDashboard";

export function Overview({
  data,
  user,
  onSelect,
}: {
  data: DashboardData;
  user: User;
  onSelect: (ticket: Ticket) => void;
}) {
  const active = data.tickets.filter((ticket) =>
    ["received", "assigned", "verifying"].includes(ticket.status),
  );
  const overdue = active.filter(
    (ticket) => ticket.due_at && Date.parse(ticket.due_at) < data.now,
  );
  const complete = data.tickets.length - active.length;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">KHÔNG GIAN SỐNG KHÔNG KHÓI THUỐC</div>
          <h1>Tổng quan vận hành</h1>
          <p>Theo dõi phản ánh. Phối hợp xử lý. Chủ động phòng ngừa.</p>
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
      {!data.loading && data.lastSync && overdue.length > 0 && (
        <div className="attention-banner">
          <ClockCircleOutlined aria-hidden />
          <div>
            <strong>{overdue.length} phiếu đã quá hạn cần được kiểm tra</strong>
            <p>Mở danh sách để xem khu vực và tình trạng xử lý.</p>
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
            label: "Đã hoàn tất xử lý",
            value: complete,
            icon: <SafetyCertificateOutlined />,
            note: "Xử lý / phản hồi / đóng",
            style: "blue",
            href: "/tickets?scope=completed",
          },
          {
            label: "Khu vực theo dõi",
            value: data.zones.length,
            icon: <EnvironmentOutlined />,
            note: `${data.zones.filter((zone) => zone.sensor_id).length} cảm biến · ${data.zones.length} điểm QR`,
            style: "green",
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
      <div className="overview-grid">
        <Card
          title="Phiếu mới nhất"
          extra={<Link to="/tickets">Xem tất cả →</Link>}
          className="recent-card"
        >
          <TicketTable {...data} onSelect={onSelect} compact />
        </Card>
        <Card className="prevention-card">
          <div className="eyebrow">PHÒNG NGỪA & HỖ TRỢ</div>
          <h2>
            Một không gian chung,
            <br />
            một bầu không khí sạch.
          </h2>
          <div className="infographic-placeholder">
            <PictureOutlined />
            <strong>Góc truyền thông</strong>
            <span>Chưa có infographic được đăng</span>
          </div>
          <p>
            Thông điệp dành cho sinh viên sẽ xuất hiện tại đây và trong lớp
            Phòng ngừa của ứng dụng sinh viên.
          </p>
          <Tag>Nội dung sắp được cập nhật</Tag>
          {user.role === "manager" && (
            <p className="muted">
              Tại đây sẽ hiển thị infographic do ban quản lý lựa chọn cho sinh
              viên.
            </p>
          )}
        </Card>
      </div>
      <Card className="flow-card">
        <span className="eyebrow">QUY TRÌNH PHỐI HỢP</span>
        <div className="process-flow">
          {[
            "Tiếp nhận",
            "Phân công",
            "Xác minh",
            "Xử lý",
            "Phản hồi",
            "Đóng phiếu",
          ].map((label, index) => (
            <div key={label}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {label}
            </div>
          ))}
        </div>
        <p className="muted">
          Cảnh báo cảm biến là nghi vấn; kết luận cần người xác minh.
        </p>
      </Card>
    </>
  );
}
