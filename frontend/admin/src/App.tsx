import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Descriptions,
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
  BarChartOutlined,
  FileTextOutlined,
  LogoutOutlined,
  MenuOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  roleLabels,
  sourceLabels,
  statusLabels,
  priorityLabels,
  type Ticket,
  type User,
} from "../../../backend/src/contracts";
import { api, errorMessage } from "./api";
import { useDashboard } from "./useDashboard";
import { TicketTable } from "./components/TicketTable";
import { Overview } from "./pages/Overview";
import { Floors } from "./pages/Floors";
import { Analytics } from "./pages/analytics/Analytics";
import { Shift } from "./pages/Shift";

const storageKey = "sfz-session-token";
const navigation = [
  {
    key: "/",
    label: "Tổng quan",
    icon: <AppstoreOutlined />,
    roles: ["manager", "analyst", "viewer"],
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
    key: "/analytics",
    label: "Phân tích",
    icon: <BarChartOutlined />,
    roles: ["manager", "analyst", "viewer"],
  },
  {
    key: "/shift",
    label: "Ca trực",
    icon: <TeamOutlined />,
    roles: ["manager", "guard"],
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
          <p>Không gian vận hành dành cho ban quản lý và ca trực ký túc xá.</p>
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
  const data = useDashboard(token, expire);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string>();
  const selected = data.tickets.find((ticket) => ticket.code === selectedCode);
  const selectTicket = (ticket: Ticket) => setSelectedCode(ticket.code);
  const location = useLocation();
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
      <Menu mode="inline" selectedKeys={[location.pathname]} items={items} />
      <div className="sidebar-footer">
        <div className="campus-mark">KTX</div>
        <strong>Ký túc xá VNU</strong>
        <p>
          Phát hiện · Phản hồi
          <br />
          Phòng ngừa · Hỗ trợ
        </p>
        <Tag>Dữ liệu KTX giả lập</Tag>
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
              Ký túc xá <span>/</span>{" "}
              {navigation.find((item) => item.key === location.pathname)
                ?.label || "Dashboard"}
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
              Bản dùng thử · Dữ liệu KTX giả lập
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
              path="/analytics"
              element={protect("/analytics", <Analytics />)}
            />
            <Route
              path="/shift"
              element={protect(
                "/shift",
                <Shift data={data} user={user} onSelect={selectTicket} />,
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
              aria-current={location.pathname === item.key ? "page" : undefined}
            >
              <span aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
      </nav>
      <Drawer
        title="Thông tin phiếu"
        open={!!selectedCode}
        onClose={() => setSelectedCode(undefined)}
        size={440}
      >
        {selected ? (
          <>
            <h2>{selected.code}</h2>
            <Descriptions
              column={1}
              items={[
                {
                  key: "zone",
                  label: "Khu vực",
                  children: `${data.zones.find((zone) => zone.code === selected.zone_code)?.name || ""} (${selected.zone_code})`,
                },
                {
                  key: "priority",
                  label: "Mức ưu tiên",
                  children: priorityLabels[selected.priority],
                },
                {
                  key: "source",
                  label: "Nguồn tin",
                  children: sourceLabels[selected.source],
                },
                {
                  key: "status",
                  label: "Trạng thái",
                  children: statusLabels[selected.status],
                },
                {
                  key: "presence",
                  label: "Hiện diện",
                  children:
                    selected.presence === null
                      ? "Không rõ"
                      : selected.presence
                        ? "Có người tại chỗ"
                        : "Không còn ai",
                },
                {
                  key: "created",
                  label: "Tiếp nhận",
                  children: new Date(selected.created_at).toLocaleString(
                    "vi-VN",
                  ),
                },
                {
                  key: "due",
                  label: "Hạn xử lý",
                  children: selected.due_at
                    ? new Date(selected.due_at).toLocaleString("vi-VN")
                    : "Không có",
                },
              ]}
            />
            <Alert
              type="info"
              showIcon
              title="Phiếu đang ở chế độ chỉ xem. Lịch sử và thao tác xử lý sẽ được bổ sung sau."
            />
            <Link
              to={`/floors?zone=${encodeURIComponent(selected.zone_code)}`}
              onClick={() => setSelectedCode(undefined)}
              className="drawer-map-link"
            >
              <Button block type="primary">
                Xem vị trí trên sơ đồ
              </Button>
            </Link>
          </>
        ) : (
          <p>Phiếu không còn trong danh sách hiện tại.</p>
        )}
      </Drawer>
    </Layout>
  );
}

export default function App() {
  const [session, setSession] = useState<{ token: string; user: User }>();
  const [checking, setChecking] = useState(true);
  const [reason, setReason] = useState("");
  useEffect(() => {
    let active = true;
    const token = sessionStorage.getItem(storageKey);
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
          sessionStorage.removeItem(storageKey);
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
    sessionStorage.removeItem(storageKey);
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
          sessionStorage.setItem(storageKey, session.token);
          setSession(session);
          setReason("");
        }}
      />
    );
  return <Dashboard key={session.token} session={session} onLogout={logout} />;
}
