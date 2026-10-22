import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, App as AntApp, Button, Card, Collapse, Empty, Tag } from "antd";
import { BellOutlined, DownloadOutlined, MobileOutlined } from "@ant-design/icons";
import { roomOfUser, statusLabels, type User } from "../../../../backend/src/contracts";
import { dispatchOf, mmss } from "../components/DispatchControl";
import { remaining } from "../components/TicketTable";
import type { DashboardData } from "../useDashboard";
import {
  alertLogCsv,
  canInstall,
  clearAlertLog,
  enableNotifications,
  getAlertLog,
  isIOS,
  isStandalone,
  permission,
  promptInstall,
  showAlertNotification,
} from "../push";

export function IphoneGuide() {
  return (
    <ol className="iphone-guide">
      <li>
        Mở trang này bằng <strong>Safari</strong> (iOS 16.4 trở lên).
      </li>
      <li>
        Bấm nút <strong>Chia sẻ</strong> (ô vuông có mũi tên lên) ở thanh dưới.
      </li>
      <li>
        Chọn <strong>“Thêm vào MH chính”</strong>, đặt tên “SFZ Ca trực”, bấm <strong>Thêm</strong>.
      </li>
      <li>
        Mở app <strong>từ biểu tượng trên màn hình chính</strong>, đăng nhập, bấm <strong>“Bật thông báo”</strong> rồi chọn{" "}
        <strong>Cho phép</strong>.
      </li>
      <li>
        Nếu lỡ bấm “Không cho phép”: Cài đặt → Thông báo → SFZ Ca trực → bật Cho phép thông báo.
      </li>
    </ol>
  );
}

function NotificationSetup({ user, token, sampleCode }: { user: User; token: string; sampleCode?: string }) {
  const { message } = AntApp.useApp();
  const [perm, setPerm] = useState(permission());
  const [busy, setBusy] = useState(false);
  const [installable, setInstallable] = useState(canInstall());
  const ios = isIOS();
  const standalone = isStandalone();

  useEffect(() => {
    const on = () => setInstallable(canInstall());
    window.addEventListener("sfz-installable", on);
    return () => window.removeEventListener("sfz-installable", on);
  }, []);

  return (
    <Card className="notify-card" title={<><BellOutlined aria-hidden /> Nhận cảnh báo trên điện thoại</>}>
      <div className="notify-status">
        <Tag color={standalone ? "green" : undefined}>{standalone ? "Đang chạy dạng app" : "Đang mở trên trình duyệt"}</Tag>
        <Tag color={perm === "granted" ? "green" : perm === "denied" ? "red" : undefined}>
          {perm === "granted" ? "Đã cho phép thông báo" : perm === "denied" ? "Đã chặn thông báo" : perm === "unsupported" ? "Chưa hỗ trợ thông báo" : "Chưa bật thông báo"}
        </Tag>
      </div>
      {ios && !standalone && (
        <Alert
          type="warning"
          showIcon
          title="iPhone chỉ nhận thông báo khi trang được thêm vào Màn hình chính"
          description={<IphoneGuide />}
        />
      )}
      <div className="notify-actions">
        {installable && !standalone && (
          <Button
            size="large"
            icon={<MobileOutlined />}
            onClick={async () => {
              if (await promptInstall()) message.success("Đã cài app ca trực");
              setInstallable(canInstall());
            }}
          >
            Cài app lên điện thoại
          </Button>
        )}
        <Button
          size="large"
          type="primary"
          icon={<BellOutlined />}
          loading={busy}
          disabled={perm === "unsupported" && !(ios && !standalone)}
          onClick={async () => {
            setBusy(true);
            const r = await enableNotifications(token, user.id);
            setPerm(r.permission);
            setBusy(false);
            if (r.permission === "granted") message.success(r.message);
            else message.warning(r.message);
          }}
        >
          {perm === "granted" ? "Bật lại / kiểm tra" : "Bật thông báo"}
        </Button>
        {perm === "granted" && (
          <Button
            size="large"
            onClick={async () => {
              const ok = await showAlertNotification({
                ticket_code: sampleCode ?? "",
                title: "Thử thông báo SFZ",
                body: sampleCode ? `Bấm vào đây để mở phiếu ${sampleCode}.` : "Thông báo đã hoạt động trên máy này.",
                dispatched_at: null,
              });
              if (!ok) message.warning("Chưa hiện được thông báo trên máy này.");
            }}
          >
            Gửi thử
          </Button>
        )}
      </div>
      {!ios && (
        <Collapse
          ghost
          items={[{ key: "ios", label: "Hướng dẫn cho iPhone", children: <IphoneGuide /> }]}
        />
      )}
      <p className="muted small">
        Thông báo hiện khi Ban quản lý điều phối phiếu cho phòng của bạn; bấm vào là mở thẳng phiếu với 3 nút Đang đến /
        Đã đến / Báo nhầm.
      </p>
    </Card>
  );
}

function AlertLog() {
  const [items, setItems] = useState(getAlertLog);
  useEffect(() => {
    const on = () => setItems(getAlertLog());
    window.addEventListener("sfz-alert-log", on);
    return () => window.removeEventListener("sfz-alert-log", on);
  }, []);
  const latencies = items.map((i) => i.latency_ms).filter((v): v is number => v !== null).sort((a, b) => a - b);
  const median = latencies.length ? latencies[Math.floor(latencies.length / 2)] : null;
  return (
    <Card
      size="small"
      title="Nhật ký nhận cảnh báo trên máy này"
      extra={
        items.length > 0 && (
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => {
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob([alertLogCsv(items)], { type: "text/csv" }));
              a.download = `nhan-canh-bao-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            CSV
          </Button>
        )
      }
    >
      {!items.length ? (
        <p className="muted">Chưa nhận cảnh báo nào trên máy này.</p>
      ) : (
        <>
          <p className="muted small">
            {items.length} lần nhận · độ trễ trung vị {median !== null ? `${(median / 1000).toFixed(1)} giây` : "—"} (theo đồng hồ máy này).
          </p>
          <ul className="alert-log">
            {items.slice(0, 8).map((i) => (
              <li key={i.ticket_code + i.received_at}>
                <Link to={`/tickets/${encodeURIComponent(i.ticket_code)}`}>{i.ticket_code}</Link>
                <span>{new Date(i.received_at).toLocaleTimeString("vi-VN")}</span>
                <span>{i.channel === "webpush" ? "Web Push" : "Realtime"}</span>
                <span>{i.latency_ms !== null ? `${(i.latency_ms / 1000).toFixed(1)} s` : "—"}</span>
              </li>
            ))}
          </ul>
          <Button size="small" type="text" onClick={clearAlertLog}>
            Xoá nhật ký
          </Button>
        </>
      )}
    </Card>
  );
}

export function Shift({ data, user, token }: { data: DashboardData; user: User; token: string }) {
  const active = data.tickets
    .filter(
      (t) =>
        ["received", "assigned", "verifying"].includes(t.status) &&
        (user.role !== "guard" || !t.assignee_id || t.assignee_id === user.id),
    )
    .sort((a, b) => {
      const oa = remaining(a, data.now).overdue ? 0 : 1;
      const ob = remaining(b, data.now).overdue ? 0 : 1;
      return oa - ob || b.created_at.localeCompare(a.created_at);
    });
  const room = roomOfUser(user.id);
  const roomStatus = data.rooms?.items.find((r) => r.id === room?.id);
  return (
    <div className="shift-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">{room ? room.name.toUpperCase() : "CA TRỰC"}</div>
          <h1>Phiếu cần xử lý</h1>
          <p>
            {active.length
              ? `${active.length} phiếu Ban quản lý đã điều phối cho phòng`
              : "Chưa có phiếu nào được điều phối cho phòng."}
          </p>
          {roomStatus && (
            <p className="muted small">
              <Tag color={roomStatus.on_duty ? "green" : undefined}>
                {roomStatus.hours === "24/7" ? "Trực 24/7" : roomStatus.on_duty ? "Đang trong giờ trực" : "Ngoài giờ trực"}
              </Tag>
              {roomStatus.location} · {roomStatus.hours === "office" ? data.rooms?.office_hours_label : "cả ngày"}
            </p>
          )}
        </div>
      </div>
      {!active.length && (
        <Card>
          <Empty description="Khi Ban quản lý điều phối phiếu cho phòng, thông báo sẽ hiện trên điện thoại và tại đây. Có 3 phút để nhận." />
        </Card>
      )}
      {active.map((ticket) => {
        const zone = data.zones.find((z) => z.code === ticket.zone_code);
        const deadline = remaining(ticket, data.now);
        const dispatch = dispatchOf(data, ticket.code);
        const acceptLeft = dispatch ? Date.parse(dispatch.accept_deadline) - data.now : 0;
        const waiting = !ticket.assignee_id && !!dispatch;
        return (
          <Link key={ticket.code} to={`/tickets/${encodeURIComponent(ticket.code)}`} className="shift-ticket-link">
            <Card className={deadline.overdue ? "shift-ticket overdue-card" : "shift-ticket"}>
              <div className="shift-ticket-head">
                <strong>{ticket.code}</strong>
                <Tag color={ticket.status === "received" ? "red" : "blue"}>{statusLabels[ticket.status]}</Tag>
              </div>
              <h2>{zone?.name ?? ticket.zone_code}</h2>
              <p className="muted">
                {ticket.zone_code} · {ticket.assignee_id === user.id ? "Phiếu của bạn" : ticket.assignee_id ? "Đã giao" : "Chưa ai nhận"}
              </p>
              {waiting && (
                <p className={acceptLeft > 0 ? "accept-window" : "accept-window late"}>
                  {acceptLeft > 0
                    ? `Nhận trong ${mmss(acceptLeft)}`
                    : "Quá 3 phút chưa nhận — bấm Đang đến ngay"}
                  {dispatch.note ? ` · ${dispatch.note}` : ""}
                </p>
              )}
              <div className="shift-ticket-foot">
                <Tag color={ticket.presence ? "orange" : undefined}>
                  {ticket.presence === null ? "Hiện diện: không rõ" : ticket.presence ? "Có người tại chỗ" : "Không còn ai"}
                </Tag>
                <span className={deadline.overdue ? "overdue" : ""}>{deadline.text}</span>
              </div>
            </Card>
          </Link>
        );
      })}
      <NotificationSetup user={user} token={token} sampleCode={active[0]?.code} />
      <AlertLog />
    </div>
  );
}
