import { useState } from "react";
import { Alert, App as AntApp, Button, Input, Popconfirm, Progress, Select, Space, Tag } from "antd";
import { PhoneOutlined, SendOutlined, SwapOutlined } from "@ant-design/icons";
import {
  ACCEPT_WINDOW_SECONDS,
  suggestRoom,
  type Dispatch,
  type RoomStatus,
  type Ticket,
  type User,
  type Zone,
} from "../../../../backend/src/contracts";
import { api, errorMessage } from "../api";
import type { DashboardData } from "../useDashboard";
import { planSteps } from "../workflow";

const clock = (iso: string) => new Date(iso).toLocaleTimeString("vi-VN");
/** Đếm ngược hạn nhận dạng m:ss (giới hạn 3:00 khi đồng hồ máy lệch với máy chủ) */
export const mmss = (ms: number) => {
  const s = Math.min(ACCEPT_WINDOW_SECONDS, Math.max(0, Math.ceil(ms / 1000)));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function roomLabel(room: RoomStatus) {
  const load = room.waiting + room.in_progress;
  return `${room.name} · ${room.on_duty ? "đang trực" : "ngoài giờ"}${load ? ` · ${load} phiếu` : ""}`;
}

/** Tên cán bộ theo mã tài khoản (từ danh sách phòng trực) */
export function staffName(data: DashboardData, id: string | null) {
  if (!id) return null;
  for (const room of data.rooms?.items ?? []) {
    const s = room.staff.find((x) => x.id === id);
    if (s) return `${s.name} (${room.name})`;
  }
  return null;
}

export function dispatchOf(data: DashboardData, code: string): Dispatch | undefined {
  return data.dispatches.find((d) => d.ticket_code === code);
}

/**
 * Điều phối một phiếu: Ban quản lý xác minh xong thì giao cho phòng trực (mặc định phòng của toà,
 * ngoài giờ hành chính đề xuất Phòng bảo vệ). Sau khi giao: đếm ngược 3 phút; quá hạn hiện số gọi (giả lập).
 */
export function DispatchControl({
  ticket,
  zone,
  data,
  token,
  user,
}: {
  ticket: Ticket;
  zone?: Zone | null;
  data: DashboardData;
  token: string;
  user: User;
}) {
  const { message } = AntApp.useApp();
  const dispatch = dispatchOf(data, ticket.code);
  const rooms = data.rooms?.items ?? [];
  const suggestion = zone ? suggestRoom(zone.building, new Date(data.now)) : null;
  const [roomId, setRoomId] = useState<string>();
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [moving, setMoving] = useState(false);
  const [busy, setBusy] = useState<"send" | "call" | "dismiss" | null>(null);
  const manager = user.role === "manager";
  const chosen = rooms.find((r) => r.id === (roomId ?? suggestion?.room.id));
  const roomOf = (id: string) => rooms.find((r) => r.id === id);

  async function send() {
    if (!chosen) return;
    setBusy("send");
    try {
      await api.dispatch(token, { ticket_code: ticket.code, room_id: chosen.id, note: note.trim() || undefined });
      message.success(`Đã điều phối cho ${chosen.name}`);
      setMoving(false);
      setNote("");
      setRoomId(undefined);
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setBusy(null);
      void data.refresh();
    }
  }

  async function logCall() {
    setBusy("call");
    try {
      await api.callRoom(token, ticket.code);
      message.success("Đã ghi nhận cuộc gọi vào lịch sử phiếu");
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setBusy(null);
      void data.refresh();
    }
  }

  async function dismiss() {
    setBusy("dismiss");
    try {
      for (const step of planSteps(ticket.status, "dismiss", reason.trim()))
        await api.setStatus(token, ticket.code, { status: step.status, note: step.note });
      message.success("Đã kết luận báo nhầm, không cử người kiểm tra");
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setBusy(null);
      void data.refresh();
    }
  }

  const picker = (
    <div className="dispatch-picker">
      <label className="filter-field">
        <span>Giao cho</span>
        <Select
          aria-label="Chọn phòng trực"
          value={chosen?.id}
          onChange={setRoomId}
          options={rooms.map((r) => ({
            value: r.id,
            label: `${roomLabel(r)}${r.id === suggestion?.room.id ? " · đề xuất" : ""}`,
          }))}
        />
      </label>
      {suggestion && <p className="muted small">{suggestion.reason}.</p>}
      {chosen && !chosen.on_duty && (
        <Alert type="warning" showIcon title={`${chosen.name} đang ngoài giờ trực (${data.rooms?.office_hours_label}).`} />
      )}
      <Input
        aria-label="Ghi chú cho phòng trực"
        placeholder="Ghi chú cho phòng trực (không bắt buộc), VD: cảm biến + 2 phản ánh, có người tại chỗ"
        maxLength={160}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Space wrap>
        <Button type="primary" icon={<SendOutlined />} loading={busy === "send"} disabled={!chosen || !!busy} onClick={send}>
          {dispatch ? "Chuyển phòng" : "Điều phối kiểm tra"}
        </Button>
        {dispatch && (
          <Button onClick={() => setMoving(false)} disabled={!!busy}>
            Huỷ
          </Button>
        )}
        {!dispatch && (
          <Popconfirm
            title="Kết luận báo nhầm, không cử người?"
            description={
              <Input
                aria-label="Lý do báo nhầm"
                placeholder="Lý do, VD: cảm biến đang bảo trì"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            }
            okText="Kết luận báo nhầm"
            cancelText="Không"
            onConfirm={dismiss}
          >
            <Button danger type="text" loading={busy === "dismiss"} disabled={!!busy}>
              Không cần kiểm tra (báo nhầm)
            </Button>
          </Popconfirm>
        )}
      </Space>
    </div>
  );

  if (!dispatch) {
    if (ticket.status !== "received")
      return <p className="muted small">Phiếu này không qua bước điều phối.</p>;
    if (!manager) return <p className="muted small">Chờ Ban quản lý xác minh và điều phối.</p>;
    return picker;
  }

  const room = roomOf(dispatch.room_id);
  const left = Date.parse(dispatch.accept_deadline) - data.now;
  if (dispatch.status === "accepted" && dispatch.accepted_at) {
    const secs = Math.max(0, Math.round((Date.parse(dispatch.accepted_at) - Date.parse(dispatch.dispatched_at)) / 1000));
    return (
      <div className="dispatch-state">
        <Tag color="green">Đã có người nhận</Tag>
        <p>
          <strong>{dispatch.accepted_by_name ?? "Cán bộ trực"}</strong> · {room?.name ?? dispatch.room_id} nhận lúc{" "}
          {clock(dispatch.accepted_at)} ({secs < 60 ? `${secs} giây` : `${Math.round(secs / 60)} phút`} sau khi điều phối)
        </p>
      </div>
    );
  }
  if (moving && manager) return picker;

  const overdue = dispatch.status === "overdue" || left <= 0;
  return (
    <div className="dispatch-state">
      <div className="dispatch-head">
        <Tag color={overdue ? "red" : "gold"}>{overdue ? "Quá 3 phút chưa nhận" : "Chờ phòng trực nhận"}</Tag>
        <span>
          {room?.name ?? dispatch.room_id} · điều phối lúc {clock(dispatch.dispatched_at)}
        </span>
      </div>
      {!overdue && (
        <div className="dispatch-countdown" aria-live="polite">
          <strong>{mmss(left)}</strong>
          <Progress
            percent={Math.round((left / (ACCEPT_WINDOW_SECONDS * 1000)) * 100)}
            showInfo={false}
            size="small"
            strokeColor="#d48806"
          />
        </div>
      )}
      {dispatch.note && <p className="muted small">Ghi chú: {dispatch.note}</p>}
      {overdue && room && (
        <Alert
          type="error"
          showIcon
          icon={<PhoneOutlined />}
          title={
            <>
              Gọi {room.name}: <strong className="phone">{room.phone}</strong>
            </>
          }
          description={
            dispatch.calls.length
              ? `Đã gọi ${dispatch.calls.length} lần, lần cuối lúc ${clock(dispatch.calls.at(-1)!.at)}.`
              : `${room.location}. Chưa có cán bộ nào nhận phiếu sau ${ACCEPT_WINDOW_SECONDS / 60} phút.`
          }
        />
      )}
      {manager && (
        <Space wrap>
          {overdue && (
            <Button icon={<PhoneOutlined />} loading={busy === "call"} disabled={!!busy} onClick={logCall}>
              Đã gọi điện
            </Button>
          )}
          <Button icon={<SwapOutlined />} disabled={!!busy} onClick={() => setMoving(true)}>
            Chuyển phòng khác
          </Button>
        </Space>
      )}
    </div>
  );
}
