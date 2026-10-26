import { ExperimentOutlined, PlayCircleOutlined, UndoOutlined } from "@ant-design/icons";
import { App as AntApp, Button, Card, Select, Space, Tag } from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";
import { statusLabels } from "../../../../backend/src/contracts";
import { api, errorMessage } from "../api";
import type { DashboardData } from "../useDashboard";

/**
 * Khu thử của Ban Giám khảo: tạo phiếu mô phỏng ("Chạy kịch bản") và "Đặt lại".
 * Phiếu sandbox không lẫn vào số liệu chính và tự xoá sau 30 phút.
 */
export function SandboxPanel({ data, token }: { data: DashboardData; token: string }) {
  const { message } = AntApp.useApp();
  const sensorZones = data.zones.filter((z) => z.sensor_id);
  const [zone, setZone] = useState<string | undefined>(sensorZones[0]?.code);
  const [busy, setBusy] = useState<"run" | "reset" | null>(null);
  const sandboxTickets = data.tickets.filter((t) => t.is_sandbox);
  const selected = zone ?? sensorZones[0]?.code;

  const run = async () => {
    if (!selected) return;
    setBusy("run");
    try {
      const ticket = await api.createSandboxTicket(token, selected);
      message.success(`Đã tạo phiếu thử ${ticket.code}. Mở phiếu để đi qua 6 bước xử lý.`);
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };
  const reset = async () => {
    setBusy("reset");
    try {
      const res = await api.resetSandbox(token);
      message.success(res.message);
    } catch (error) {
      message.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card
      className="sandbox-card"
      title={
        <>
          <ExperimentOutlined aria-hidden /> Khu thử
        </>
      }
      extra={<Tag color="purple">Không ảnh hưởng dữ liệu chính</Tag>}
    >
      <Space wrap>
        <Select
          aria-label="Khu vực chạy kịch bản"
          style={{ minWidth: 240 }}
          value={selected}
          onChange={setZone}
          options={sensorZones.map((z) => ({ value: z.code, label: `${z.code} · ${z.name}` }))}
        />
        <Button type="primary" icon={<PlayCircleOutlined />} loading={busy === "run"} disabled={!selected} onClick={run}>
          Chạy kịch bản
        </Button>
        <Button icon={<UndoOutlined />} loading={busy === "reset"} onClick={reset}>
          Đặt lại
        </Button>
      </Space>
      {sandboxTickets.length > 0 && (
        <ul className="sandbox-list">
          {sandboxTickets.map((t) => (
            <li key={t.code}>
              <Link to={`/tickets/${encodeURIComponent(t.code)}`}>{t.code}</Link>
              <span>{t.zone_code}</span>
              <Tag>{statusLabels[t.status]}</Tag>
            </li>
          ))}
        </ul>
      )}
      <p className="muted small">Phiếu thử tự xoá sau 30 phút.</p>
    </Card>
  );
}
