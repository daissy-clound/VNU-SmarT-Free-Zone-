import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  Result,
  Segmented,
  Skeleton,
  Steps,
  Tag,
  Timeline,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CarOutlined,
  EnvironmentOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  priorityLabels,
  sourceLabels,
  statusLabels,
  statuses,
  type Telemetry,
  type User,
} from "../../../../backend/src/contracts";
import { api, errorMessage, type TicketDetail as Detail } from "../api";
import { DustChart } from "../components/DustChart";
import { remaining } from "../components/TicketTable";
import type { DashboardData } from "../useDashboard";
import {
  VERIFY_QUESTIONS,
  arrivalTime,
  availableActions,
  isFalseAlarm,
  minutesBetween,
  planSteps,
  signalCounts,
  verifyNote,
  type ActionKey,
  type VerifyAnswers,
} from "../workflow";

const fmt = (iso: string) => new Date(iso).toLocaleString("vi-VN");
const presenceText = (p: boolean | null) => (p === null ? "Không rõ" : p ? "Có người tại chỗ" : "Không còn ai");
const priorityColor = { low: "default", normal: "blue", high: "orange", urgent: "red" } as const;

export function TicketDetailPage({ data, user, token }: { data: DashboardData; user: User; token: string }) {
  const { code = "" } = useParams();
  const { message } = AntApp.useApp();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<ActionKey | null>(null);
  const [answers, setAnswers] = useState<VerifyAnswers>({});
  const [reply, setReply] = useState("");
  const [dust, setDust] = useState<Telemetry[] | null>(null);
  const listed = data.tickets.find((t) => t.code === code);

  const load = useCallback(async () => {
    try {
      setDetail(await api.ticket(token, code));
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [token, code]);

  // Tải lại khi phiếu đổi trên máy chủ (Socket.IO làm mới danh sách)
  useEffect(() => {
    void load();
  }, [load, listed?.updated_at, listed?.status]);

  const sensorId = detail?.zone?.sensor_id;
  useEffect(() => {
    if (!sensorId) return;
    let alive = true;
    const pull = () =>
      api
        .telemetry(token, sensorId)
        .then((items) => alive && setDust(items))
        .catch(() => alive && setDust([]));
    void pull();
    const t = window.setInterval(pull, 10_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [token, sensorId]);

  if (error && !detail)
    return (
      <Result
        status="404"
        title="Không mở được phiếu"
        subTitle={error}
        extra={<Link to="/tickets"><Button type="primary">Về danh sách phiếu</Button></Link>}
      />
    );
  if (!detail) return <Skeleton active paragraph={{ rows: 8 }} />;

  const { ticket, zone, history } = detail;
  const actions = availableActions(user.role, ticket);
  const arrived = arrivalTime(history);
  const falseAlarm = isFalseAlarm(history);
  const signals = signalCounts(history);
  const deadline = remaining(ticket, data.now);
  const stepIndex = statuses.indexOf(ticket.status);
  const sortedHistory = [...history].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const fieldMode = user.role === "guard" || user.role === "manager";

  async function run(action: ActionKey, detailText = "") {
    const steps = planSteps(ticket.status, action, detailText);
    if (!steps.length) return;
    setBusy(action);
    try {
      for (const step of steps) {
        await api.setStatus(token, ticket.code, {
          status: step.status,
          note: step.note || undefined,
          assignee_id: step.assignToSelf ? user.id : undefined,
        });
      }
      message.success(
        action === "arrived"
          ? `Đã ghi nhận có mặt lúc ${new Date().toLocaleTimeString("vi-VN")}`
          : "Đã cập nhật phiếu",
      );
      setAnswers({});
      setReply("");
    } catch (err) {
      message.error(errorMessage(err));
    } finally {
      setBusy(null);
      await load();
      void data.refresh();
    }
  }

  const can = (a: ActionKey) => actions.includes(a);
  const verifying = ticket.status === "verifying";
  const note = verifyNote(answers);

  return (
    <div className="ticket-detail">
      <div className="page-heading">
        <div>
          <Link to="/tickets" className="back-link">
            <ArrowLeftOutlined aria-hidden /> Danh sách phiếu
          </Link>
          <h1>{ticket.code}</h1>
          <div className="ticket-tags">
            <Tag color={ticket.status === "closed" ? "default" : "green"}>{statusLabels[ticket.status]}</Tag>
            <Tag color={priorityColor[ticket.priority]}>Ưu tiên: {priorityLabels[ticket.priority]}</Tag>
            <Tag>{sourceLabels[ticket.source]}</Tag>
            <Tag color={ticket.presence ? "orange" : undefined}>{presenceText(ticket.presence)}</Tag>
            {ticket.is_sandbox && <Tag color="purple">Phiếu thử (sandbox)</Tag>}
            {falseAlarm && <Tag>Báo nhầm</Tag>}
          </div>
          <p>
            <EnvironmentOutlined aria-hidden /> {zone?.name ?? ticket.zone_code} · {ticket.zone_code}
          </p>
        </div>
        <div className={deadline.overdue ? "deadline overdue" : "deadline"}>
          <small>{arrived ? "Có mặt sau" : "Hạn có mặt"}</small>
          <strong>
            {arrived ? `${Math.max(0, minutesBetween(ticket.created_at, arrived))} phút` : deadline.text}
          </strong>
        </div>
      </div>

      <div className="steps-compact" aria-label={`Bước ${stepIndex + 1}/6: ${statusLabels[ticket.status]}`}>
        <span>
          Bước {stepIndex + 1}/6 · <strong>{statusLabels[ticket.status]}</strong>
        </span>
        <span className="step-dots" aria-hidden>
          {statuses.map((s, i) => (
            <i key={s} className={i < stepIndex ? "done" : i === stepIndex ? "current" : ""} />
          ))}
        </span>
      </div>
      <Steps
        className="ticket-steps"
        size="small"
        current={stepIndex}
        status={ticket.status === "closed" ? "finish" : "process"}
        items={statuses.map((s) => ({ title: statusLabels[s] }))}
        responsive={false}
      />

      <div className="detail-grid">
        <div className="detail-main">
          {fieldMode && ticket.status !== "closed" && (
            <Card className="action-card" title="Xử lý tại hiện trường">
              {!actions.length && (
                <Alert type="info" showIcon title="Bước hiện tại không có thao tác nào thuộc vai trò của bạn." />
              )}
              {(can("en_route") || can("arrived") || can("false_alarm")) && (
                <div className="big-actions">
                  <Button
                    size="large"
                    icon={<CarOutlined />}
                    disabled={!can("en_route") || !!busy}
                    loading={busy === "en_route"}
                    onClick={() => run("en_route")}
                  >
                    Đang đến
                  </Button>
                  <Button
                    size="large"
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    disabled={!can("arrived") || !!busy}
                    loading={busy === "arrived"}
                    onClick={() => run("arrived")}
                  >
                    Đã đến
                  </Button>
                  <Button
                    size="large"
                    danger
                    icon={<StopOutlined />}
                    disabled={!can("false_alarm") || !!busy}
                    loading={busy === "false_alarm"}
                    onClick={() => run("false_alarm", note)}
                  >
                    Báo nhầm
                  </Button>
                </div>
              )}
              {arrived && (
                <p className="arrival-note">
                  <CheckCircleOutlined aria-hidden /> Có mặt lúc {new Date(arrived).toLocaleTimeString("vi-VN")} ·{" "}
                  {Math.max(0, minutesBetween(ticket.created_at, arrived))} phút sau khi tiếp nhận
                  {ticket.due_at && (Date.parse(arrived) <= Date.parse(ticket.due_at) ? " · đúng hạn" : " · trễ hạn")}
                </p>
              )}
              {verifying && can("resolve") && (
                <div className="verify-box">
                  <strong>Xác minh nhanh</strong>
                  {VERIFY_QUESTIONS.map((q) => (
                    <div key={q.key} className="verify-row">
                      <span id={`q-${q.key}`}>{q.label}</span>
                      <Segmented
                        aria-labelledby={`q-${q.key}`}
                        value={answers[q.key] ?? null}
                        onChange={(v) => setAnswers({ ...answers, [q.key]: v as "yes" | "no" | "unknown" })}
                        options={[
                          { label: "Có", value: "yes" },
                          { label: "Không", value: "no" },
                          { label: "Không rõ", value: "unknown" },
                        ]}
                      />
                    </div>
                  ))}
                  <p className="muted small">Không ghi tên, mã sinh viên hay số phòng của người vi phạm.</p>
                  <Button block size="large" type="primary" loading={busy === "resolve"} disabled={!!busy} onClick={() => run("resolve", note)}>
                    Xác nhận đã xử lý
                  </Button>
                </div>
              )}
              {can("respond") && (
                <div className="verify-box">
                  <strong>Phản hồi cho sinh viên</strong>
                  <Input.TextArea
                    aria-label="Nội dung phản hồi cho sinh viên"
                    rows={3}
                    maxLength={400}
                    showCount
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="VD: Ca trực đã có mặt và xử lý. Cảm ơn bạn đã phản ánh."
                  />
                  <p className="muted small">Sinh viên thấy nội dung này khi tra cứu mã. Không ghi thông tin cá nhân.</p>
                  <Button type="primary" disabled={!reply.trim() || !!busy} loading={busy === "respond"} onClick={() => run("respond", reply.trim())}>
                    Gửi phản hồi
                  </Button>
                </div>
              )}
              {can("close") && (
                <Button type="primary" loading={busy === "close"} disabled={!!busy} onClick={() => run("close")}>
                  Đóng phiếu
                </Button>
              )}
            </Card>
          )}

          <Card title="Lịch sử xử lý">
            <Timeline
              items={sortedHistory.map((h) => ({
                color: h.to_status === "closed" ? "gray" : h.from_status === h.to_status ? "blue" : "green",
                children: (
                  <div className="history-item">
                    <strong>
                      {h.from_status && h.from_status !== h.to_status
                        ? `${statusLabels[h.from_status]} → ${statusLabels[h.to_status]}`
                        : h.from_status === null
                          ? "Tiếp nhận phiếu"
                          : "Bổ sung thông tin"}
                    </strong>
                    <span className="muted">
                      {fmt(h.created_at)} · {h.performed_by_name || "Hệ thống"}
                    </span>
                    {h.note && <p>{h.note}</p>}
                  </div>
                ),
              }))}
            />
          </Card>
        </div>

        <div className="detail-side">
          <Card title="Thông tin phiếu">
            <Descriptions
              column={1}
              size="small"
              items={[
                { key: "zone", label: "Khu vực", children: `${zone?.name ?? ""} (${ticket.zone_code})` },
                { key: "floor", label: "Toà · tầng", children: zone ? `${zone.building} · tầng ${zone.floor}` : "—" },
                { key: "created", label: "Tiếp nhận", children: fmt(ticket.created_at) },
                { key: "due", label: "Hạn có mặt", children: ticket.due_at ? fmt(ticket.due_at) : "Không có" },
                { key: "arrived", label: "Tới hiện trường", children: arrived ? fmt(arrived) : "Chưa ghi nhận" },
                {
                  key: "assignee",
                  label: "Người phụ trách",
                  children: ticket.assignee_id ? (ticket.assignee_id === user.id ? "Bạn" : "Ca trực được giao") : "Chưa phân công",
                },
              ]}
            />
          </Card>
          <Card title="Nguồn tin">
            <p>
              <Tag>{sourceLabels[ticket.source]}</Tag>
            </p>
            <ul className="plain-list">
              <li>Tin từ cảm biến: {signals.sensor || (ticket.source === "sensor" || ticket.source === "both" ? "có" : 0)}</li>
              <li>Phản ánh của sinh viên: {signals.report || (ticket.source === "report" || ticket.source === "both" ? "có" : 0)}</li>
              <li>Hiện diện khi tiếp nhận: {presenceText(ticket.presence)}</li>
            </ul>
            <p className="muted small">Cảnh báo cảm biến là nghi vấn; kết luận cần người xác minh.</p>
          </Card>
          <Card title="Bụi mịn tại khu vực" extra={<Tag>Dữ liệu mô phỏng</Tag>}>
            {!zone?.sensor_id ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Khu vực này không đặt cảm biến (chỉ có mã QR)." />
            ) : dust === null ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : dust.length >= 2 ? (
              <>
                <DustChart items={dust} />
                <p className="muted small">Máy chủ hiện giữ khoảng 60 giây bản tin gần nhất của {zone.sensor_id}.</p>
              </>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={`Chưa có bản tin gần đây từ ${zone.sensor_id}. Biểu đồ quanh thời điểm sự việc cần máy chủ lưu tóm tắt theo phút.`}
              />
            )}
          </Card>
          <Link to={`/floors?zone=${encodeURIComponent(ticket.zone_code)}`}>
            <Button block>Xem vị trí trên sơ đồ</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
