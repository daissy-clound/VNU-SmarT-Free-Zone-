import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  App as AntApp,
  Avatar,
  Badge,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Layout,
  Menu,
  Result,
  Space,
  Spin,
  Tag,
  Tooltip,
} from "antd";
import {
  AppstoreOutlined,
  ApartmentOutlined,
  FireOutlined,
  BarChartOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  roleLabels,
  type Ticket,
  type User,
} from "../../../backend/src/contracts";
import { api, errorMessage } from "./api";
import { useDashboard, type LiveAlert } from "./useDashboard";
import { TicketDetailPage } from "./pages/TicketDetail";
import { HeatmapPage } from "./pages/HeatmapPage";
import { isStandalone, logAlert, onOpenFromNotification, showAlertNotification } from "./push";
import { TicketTable } from "./components/TicketTable";
import { Overview } from "./pages/Overview";
import { Floors } from "./pages/Floors";
import { Analytics } from "./pages/analytics/Analytics";
import { Shift } from "./pages/Shift";
import { DispatchPage } from "./pages/Dispatch";

const storageKey = "sfz-session-token";
/** App ca trực đã cài (PWA) giữ phiên trên máy để bấm thông báo là vào thẳng phiếu */
const sessionStore = () => (isStandalone() ? localStorage : sessionStorage);
const readToken = () => sessionStorage.getItem(storageKey) ?? localStorage.getItem(storageKey);
const clearToken = () => {
  sessionStorage.removeItem(storageKey);
  localStorage.removeItem(storageKey);
};
/** Đặt VITE_DATA_MODE=live khi nối dữ liệu thật để bỏ nhãn "Dữ liệu mô phỏng" */
export const SIMULATED = (import.meta.env.VITE_DATA_MODE || "simulated") !== "live";
const navigation = [
  {
    key: "/",
    label: "Tổng quan",
    icon: <AppstoreOutlined />,
    roles: ["manager", "analyst", "viewer"],
  },
  {
    key: "/dispatch",
    label: "Điều phối",
    icon: <SendOutlined />,
    roles: ["manager"],
  },
  {
    key: "/floors",
    label: "Sơ đồ tầng",
    icon: <ApartmentOutlined />,
    roles: ["manager", "guard", "analyst", "viewer"],
  },
  {
    key: "/tickets",
    label: "Phiếu",
    icon: <FileTextOutlined />,
    roles: ["manager", "guard", "analyst", "viewer"],
  },
  {
    key: "/heatmap",
    label: "Bản đồ nhiệt",
    icon: <FireOutlined />,
    roles: ["manager", "analyst", "viewer"],
  },
  {
    key: "/analytics",
    label: "Phân tích",
    icon: <BarChartOutlined />,
    roles: ["manager", "analyst", "viewer"],
  },
  {
    key: "/shift",
    label: "Phòng trực",
    icon: <TeamOutlined />,
    roles: ["guard"],
  },
];

function Login({
  onLogin,
  reason,
}: {
  onLogin: (session: { token: string; user: User }) => void;
  reason: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <main className="login-page">
      <section className="login-story">
        <div className="brand">
          <span className="brand-icon">
            <SafetyCertificateOutlined />
          </span>
          <div>
            VNU <strong>SmarT-Free Zone</strong>
            <small>KHÔNG GIAN SỐNG KHÔNG KHÓI THUỐC</small>
          </div>
        </div>
        <div>
          <div className="eyebrow">KẾT NỐI ĐỂ CÙNG CHĂM SÓC</div>
          <h1>
            Một môi trường tốt hơn.
            <br />
            Bắt đầu từ sự quan tâm.
          </h1>
          <p>Không gian vận hành dành cho ban quản lý và phòng trực khuôn viên UET Hoà Lạc.</p>
          <div className="login-steps">
            <span>01 · Phát hiện</span>
            <span>02 · Phản hồi</span>
            <span>03 · Phòng ngừa</span>
            <span>04 · Hỗ trợ</span>
          </div>
        </div>
        <small>Đội BND · VNU SmarT-Free Zone</small>
      </section>
      <section className="login-form">
        <div className="eyebrow">DASHBOARD QUẢN LÝ</div>
        <h2>Chào mừng trở lại</h2>
        <p className="muted">Đăng nhập để theo dõi và phối hợp xử lý phiếu.</p>
        {(error || reason) && (
          <Alert type="error" showIcon title={error || reason} />
        )}
        <Form
          layout="vertical"
          requiredMark={false}
          onFinish={async (values) => {
            setBusy(true);
            setError("");
            try {
              onLogin(await api.login(values));
            } catch (error) {
              setError(errorMessage(error));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Form.Item
            label="Tài khoản"
            name="username"
            rules={[{ required: true, message: "Nhập tài khoản." }]}
          >
            <Input
              size="large"
              autoComplete="username"
              placeholder="Nhập tài khoản được cấp"
            />
          </Form.Item>
          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Nhập mật khẩu." }]}
          >
            <Input.Password
              size="large"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
            />
          </Form.Item>
          <Button
            htmlType="submit"
            type="primary"
            size="large"
            block
            loading={busy}
          >
            Đăng nhập
          </Button>
        </Form>
        <div className="login-note">
          <SafetyCertificateOutlined />
          <span>
            Hệ thống không thu hình ảnh, âm thanh hoặc nhận dạng sinh viên.
          </span>
        </div>
      </section>
    </main>
  );
}

function Dashboard({
  session,
  onLogout,
}: {
  session: { token: string; user: User };
  onLogout: (expired?: boolean) => void;
}) {
  const { user, token } = session;
  const expire = useCallback(() => onLogout(true), [onLogout]);
  const navigate = useNavigate();
  const { notification } = AntApp.useApp();
  const fieldRole = user.role === "guard" || user.role === "manager";
  const zonesRef = useRef<Record<string, string>>({});
  // Cảnh báo phiếu mới: hiện ngay trên dashboard (không tải lại trang) + thông báo hệ thống cho ca trực
  const onAlert = useCallback(
    (alert: LiveAlert) => {
      const zoneName = zonesRef.current[alert.zone_code] ?? alert.zone_code;
      const presence =
        alert.presence === null ? "hiện diện không rõ" : alert.presence ? "có người tại chỗ" : "không còn ai";
      const title =
        alert.kind === "dispatched"
          ? `Ban quản lý điều phối kiểm tra · ${alert.zone_code}`
          : alert.kind === "overdue"
            ? `Quá 3 phút chưa nhận · ${alert.room_name ?? ""}`
            : alert.source === "sensor"
              ? `Cảm biến báo nghi vấn · ${alert.zone_code}`
              : `Phiếu mới · ${alert.zone_code}`;
      const body =
        alert.kind === "overdue"
          ? `${zoneName} · gọi ${alert.room_phone ?? "phòng trực"} (số giả lập)`
          : alert.kind === "dispatched"
            ? `${zoneName} · ${presence} · bấm Đang đến trong 3 phút`
            : `${zoneName} · ${presence}${user.role === "manager" ? " · cần xác minh và điều phối" : ""}`;
      const key = `${alert.kind}:${alert.ticket_code}`;
      logAlert({
        ticket_code: alert.ticket_code,
        channel: "socket",
        dispatched_at: alert.dispatched_at,
        received_at: alert.received_at,
      });
      const open = () => {
        notification.destroy(key);
        navigate(`/tickets/${encodeURIComponent(alert.ticket_code)}`);
      };
      notification[alert.kind === "overdue" ? "error" : "warning"]({
        key,
        title,
        description: `${alert.ticket_code} · ${body}`,
        placement: "topRight",
        duration: 0,
        actions: (
          <Button type="primary" size="small" onClick={open}>
            Mở phiếu
          </Button>
        ),
      });
      // App ở nền / màn hình tắt: hiện thông báo hệ thống, bấm vào mở thẳng phiếu
      if (fieldRole && document.visibilityState === "hidden")
        void showAlertNotification({
          ticket_code: alert.ticket_code,
          title,
          body,
          dispatched_at: alert.dispatched_at,
        });
    },
    [fieldRole, navigate, notification, user.role],
  );
  const data = useDashboard(token, expire, onAlert, user);
  zonesRef.current = Object.fromEntries(data.zones.map((z) => [z.code, z.name]));
  useEffect(() => onOpenFromNotification((url) => navigate(url)), [navigate]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const selectTicket = (ticket: Ticket) =>
    navigate(`/tickets/${encodeURIComponent(ticket.code)}`);
  const location = useLocation();
  const section =
    navigation.find(
      (item) => item.key !== "/" && location.pathname.startsWith(item.key),
    )?.key ?? location.pathname;
  const items = navigation
    .filter((item) => item.roles.includes(user.role))
    .map((item) => ({
      key: item.key,
      icon: <span aria-hidden="true">{item.icon}</span>,
      label: (
        <Link to={item.key} onClick={() => setMobileMenu(false)}>
          {item.label}
        </Link>
      ),
    }));
  const nav = (
    <>
      <Link
        to={user.role === "guard" ? "/shift" : "/"}
        className="brand sidebar-brand"
      >
        <span className="brand-icon">
          <SafetyCertificateOutlined />
        </span>
        <div>
          VNU <strong>SmarT-Free Zone</strong>
        </div>
      </Link>
      <div className="sidebar-caption">KHÔNG GIAN LÀM VIỆC</div>
      <Menu mode="inline" selectedKeys={[section]} items={items} />
      <div className="sidebar-footer">
        <div className="campus-mark">UET</div>
        <strong>Khuôn viên UET Hoà Lạc</strong>
        <p>
          Phát hiện · Phản hồi
          <br />
          Phòng ngừa · Hỗ trợ
        </p>
        {SIMULATED && <Tag color="gold">Dữ liệu mô phỏng</Tag>}
      </div>
    </>
  );
  const protect = (path: string, content: React.ReactNode) =>
    navigation.find((item) => item.key === path)?.roles.includes(user.role) ? (
      content
    ) : (
      <Result
        status="403"
        title="Không có quyền truy cập"
        subTitle="Trang này không thuộc vai trò của bạn."
        extra={
          <Link to={user.role === "guard" ? "/shift" : "/"}>
            <Button type="primary">Về trang chính</Button>
          </Link>
        }
      />
    );
  return (
    <Layout className="app-layout">
      <a href="#main-content" className="skip-link">
        Chuyển đến nội dung chính
      </a>
      <Layout.Sider width={238} className="desktop-sidebar" theme="light">
        {nav}
      </Layout.Sider>
      <Drawer
        title="Menu điều hướng"
        placement="left"
        open={mobileMenu}
        onClose={() => setMobileMenu(false)}
      >
        {nav}
      </Drawer>
      <Layout className="main-layout">
        <header className="app-header">
          <Space>
            <Button
              className="mobile-menu"
              icon={<MenuOutlined />}
              aria-label="Mở menu"
              onClick={() => setMobileMenu(true)}
            />
            <span className="header-location">
              Khuôn viên UET <span>/</span>{" "}
              {navigation.find((item) => item.key === section)?.label ||
                "Dashboard"}
            </span>
          </Space>
          <Space size="middle">
            <span className="connection">
              <Badge
                status={data.live && !data.error ? "success" : "warning"}
              />
              {data.error
                ? "Dữ liệu chưa đồng bộ"
                : data.live
                  ? "Đang cập nhật trực tiếp"
                  : "Tự động cập nhật mỗi 5 giây"}
            </span>
            <Avatar style={{ background: "#dcebe3", color: "#17634c" }}>
              {user.name[0]}
            </Avatar>
            <div className="user-role">
              <strong>{user.name}</strong>
              <small>{roleLabels[user.role]}</small>
            </div>
            <Tooltip title="Đăng xuất khỏi tài khoản">
              <Button
                type="text"
                icon={<LogoutOutlined />}
                aria-label="Đăng xuất"
                onClick={() => {
                  void api.logout(token).catch(() => undefined);
                  onLogout();
                }}
              />
            </Tooltip>
          </Space>
        </header>
        <main id="main-content" tabIndex={-1} className="page-content">
          <div className="sync-strip">
            <span>
              <span className="live-dot" />
              {SIMULATED ? (
                <>
                  Bản dùng thử ·{" "}
                  <Tag color="gold" className="sim-tag">
                    Dữ liệu mô phỏng
                  </Tag>
                </>
              ) : (
                "Dữ liệu vận hành"
              )}
            </span>
            <Space>
              <small>
                {data.lastSync
                  ? `Đồng bộ ${data.lastSync.toLocaleTimeString("vi-VN")}`
                  : "Đang kết nối máy chủ…"}
              </small>
              <Button
                size="small"
                type="text"
                icon={<ReloadOutlined />}
                onClick={() => void data.refresh()}
              >
                Làm mới
              </Button>
            </Space>
          </div>
          {data.error && (
            <Alert
              type="error"
              showIcon
              title={data.error}
              description={
                data.lastSync
                  ? "Đang giữ dữ liệu lần đồng bộ trước. Dữ liệu có thể đã cũ."
                  : "Chưa tải được dữ liệu."
              }
              action={
                <Button onClick={() => void data.refresh()}>Thử lại</Button>
              }
            />
          )}
          <Routes>
            <Route
              path="/"
              element={
                user.role === "guard" ? (
                  <Navigate to="/shift" replace />
                ) : (
                  <Overview data={data} user={user} onSelect={selectTicket} />
                )
              }
            />
            <Route
              path="/dispatch"
              element={protect("/dispatch", <DispatchPage data={data} user={user} token={token} />)}
            />
            <Route
              path="/floors"
              element={protect("/floors", <Floors data={data} />)}
            />
            <Route
              path="/tickets"
              element={protect(
                "/tickets",
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">TIẾP NHẬN & PHỐI HỢP</div>
                      <h1>Danh sách phiếu</h1>
                      <p>
                        Tìm phiếu, theo dõi thời hạn và xem thông tin xử lý tại
                        từng khu vực.
                      </p>
                    </div>
                    <Tag color="green">Tự động cập nhật</Tag>
                  </div>
                  <Card>
                    <TicketTable {...data} onSelect={selectTicket} />
                  </Card>
                </>,
              )}
            />
            <Route
              path="/tickets/:code"
              element={protect(
                "/tickets",
                <TicketDetailPage data={data} user={user} token={token} />,
              )}
            />
            <Route
              path="/heatmap"
              element={protect(
                "/heatmap",
                <HeatmapPage data={data} token={token} />,
              )}
            />
            <Route
              path="/analytics"
              element={protect("/analytics", <Analytics />)}
            />
            <Route
              path="/shift"
              element={protect(
                "/shift",
                <Shift data={data} user={user} token={token} />,
              )}
            />
            <Route
              path="*"
              element={
                <Result
                  status="404"
                  title="Không tìm thấy trang"
                  extra={<Link to="/">Về trang chính</Link>}
                />
              }
            />
          </Routes>
          <footer className="page-footer">
            VNU SmarT-Free Zone{" "}
            <span>Phát hiện là nghi vấn. Xác minh bởi con người.</span>
          </footer>
        </main>
      </Layout>
      <nav className="mobile-bottom-nav" aria-label="Điều hướng nhanh">
        {navigation
          .filter((item) => item.roles.includes(user.role))
          .map((item) => (
            <Link
              key={item.key}
              to={item.key}
              aria-current={section === item.key ? "page" : undefined}
            >
              <span aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
      </nav>
    </Layout>
  );
}

export default function App() {
  const [session, setSession] = useState<{ token: string; user: User }>();
  const [checking, setChecking] = useState(true);
  const [reason, setReason] = useState("");
  useEffect(() => {
    let active = true;
    const token = readToken();
    if (!token) {
      setChecking(false);
      return;
    }
    api
      .me(token)
      .then((user) => {
        if (active) setSession({ token, user });
      })
      .catch((error) => {
        if (active) {
          clearToken();
          setReason(errorMessage(error));
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const logout = useCallback((expired = false) => {
    clearToken();
    setSession(undefined);
    setReason(
      expired ? "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại." : "",
    );
  }, []);
  if (checking)
    return (
      <div className="loading-page">
        <Spin size="large" />
        <p>Đang kiểm tra phiên đăng nhập…</p>
      </div>
    );
  if (!session)
    return (
      <Login
        reason={reason}
        onLogin={(session) => {
          sessionStore().setItem(storageKey, session.token);
          setSession(session);
          setReason("");
        }}
      />
    );
  return <Dashboard key={session.token} session={session} onLogout={logout} />;
}
