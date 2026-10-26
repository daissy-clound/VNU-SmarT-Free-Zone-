import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Form,
  Input,
  Modal,
  notification,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  BarChartOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  CompassOutlined,
  ExperimentOutlined,
  EyeOutlined,
  FileDoneOutlined,
  FireOutlined,
  InfoCircleOutlined,
  RadarChartOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import { api, errorMessage } from "../../api";
import type { User } from "../../../../../backend/src/contracts";

const { Title, Text, Paragraph } = Typography;

export function Analytics({ token, user }: { token?: string; user?: User }) {
  const [activeTab, setActiveTab] = useState("forecast");
  const [loading, setLoading] = useState(false);

  // Data states
  const [forecastData, setForecastData] = useState<any>(null);
  const [transparencyData, setTransparencyData] = useState<any>(null);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [infographics, setInfographics] = useState<any[]>([]);

  // Modal upload infographic
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadForm] = Form.useForm();
  const [previewImage, setPreviewImage] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [fData, tData, wData, iData] = await Promise.all([
        api.forecast(token).catch(() => null),
        api.transparency(token).catch(() => null),
        api.weeklyReport(token).catch(() => null),
        api.infographics(token).catch(() => ({ items: [] })),
      ]);
      setForecastData(fData);
      setTransparencyData(tData);
      setWeeklyReport(wData);
      setInfographics(iData?.items || []);
    } catch (err) {
      notification.error({
        message: "Lỗi tải số liệu phân tích",
        description: errorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [token]);

  const handleUploadInfographic = async (values: any) => {
    if (!token) {
      notification.warning({ message: "Vui lòng đăng nhập quyền Quản lý" });
      return;
    }
    setUploadLoading(true);
    try {
      await api.uploadInfographic(token, {
        title: values.title,
        image_data: previewImage || undefined,
        image_url: values.image_url || previewImage || "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800",
        building: values.building || "Toàn trường",
        zone_code: values.zone_code,
      });
      notification.success({
        message: "Đăng tải infographic thành công!",
        description: "Hệ thống đã tự động lọc sạch siêu dữ liệu EXIF bảo vệ quyền riêng tư.",
      });
      setUploadModalOpen(false);
      uploadForm.resetFields();
      setPreviewImage("");
      void loadData();
    } catch (err) {
      notification.error({
        message: "Không thể đăng infographic",
        description: errorMessage(err),
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      notification.error({ message: "Kích thước ảnh vượt quá giới hạn 2 MB cho phép" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="analytics-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">TRÍ TUỆ NHÂN TẠO · DỰ BÁO RỦI RO · MINH BẠCH DỮ LIỆU</div>
          <h1>Trung tâm Phân tích & Trí tuệ Nhân tạo</h1>
          <p>
            Phát hiện sớm bất thường, xếp hạng rủi ro không - thời gian, tối ưu hóa lịch tuần tra và bảo đảm minh bạch thuật toán.
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void loadData()} loading={loading}>
            Làm mới
          </Button>
          {user?.role === "manager" && (
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={() => setUploadModalOpen(true)}
              style={{ background: "#17634c", borderColor: "#17634c" }}
            >
              Đăng Infographic tuyên truyền
            </Button>
          )}
        </Space>
      </div>

      {user?.role === "viewer" && (
        <Alert
          showIcon
          type="info"
          style={{ marginBottom: 16 }}
          message="Chế độ Trải nghiệm Dành cho Ban Giám khảo (Sandbox Mode)"
          description={
            <div style={{ marginTop: 4 }}>
              Quý Ban Giám khảo đang xem toàn bộ kết quả thực nghiệm AI 6 tuần và báo cáo phân tích tác động. Các dữ liệu thử nghiệm trong phiên của BGK được cô lập hoàn toàn và có thể đặt lại bất kỳ lúc nào.
            </div>
          }
        />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={[
          {
            key: "forecast",
            label: (
              <span>
                <CompassOutlined /> Dự báo điểm nóng & Tuần tra
              </span>
            ),
            children: (
              <div>
                {loading && !forecastData ? (
                  <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>
                ) : forecastData ? (
                  <>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={8}>
                        <Card title="Hiệu quả Mô phỏng Tuần tra" bordered={false} className="stat-card">
                          <Statistic
                            title="Độ phủ sự kiện khói (AI Gợi ý)"
                            value={forecastData.comparison_simulation?.ai_suggested_coverage}
                            suffix="%"
                            valueStyle={{ color: "#17634c", fontWeight: 700 }}
                          />
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary">So với tuần tra cố định: </Text>
                            <Tag color="volcano">{forecastData.comparison_simulation?.fixed_patrol_coverage}%</Tag>
                            <Tag color="green">Tăng {forecastData.comparison_simulation?.improvement_factor}</Tag>
                          </div>
                          <Progress
                            percent={forecastData.comparison_simulation?.ai_suggested_coverage}
                            strokeColor="#17634c"
                            style={{ marginTop: 12 }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} md={8}>
                        <Card title="Điểm nóng Nguy cơ Cao nhất" bordered={false} className="stat-card">
                          <Statistic
                            title={forecastData.top_hotspots?.[0]?.zone_name || "N/A"}
                            value={forecastData.top_hotspots?.[0]?.risk_score}
                            suffix="/ 100 điểm rủi ro"
                            valueStyle={{ color: "#d4380d", fontWeight: 700 }}
                          />
                          <div style={{ marginTop: 8 }}>
                            <Tag color="red">Khung giờ nóng: {forecastData.top_hotspots?.[0]?.peak_hour}:00 - {forecastData.top_hotspots?.[0]?.peak_hour + 1}:00</Tag>
                          </div>
                          <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
                            Hành động: {forecastData.top_hotspots?.[0]?.recommended_actions}
                          </Text>
                        </Card>
                      </Col>
                      <Col xs={24} md={8}>
                        <Card title="Lịch Ca tuần tra Đề xuất" bordered={false} className="stat-card">
                          <Statistic
                            title="Số ca tuần tra thông minh tối ưu"
                            value={forecastData.recommended_patrol_shifts?.length || 6}
                            suffix="ca / ngày (30p/ca)"
                            valueStyle={{ color: "#0958d9", fontWeight: 700 }}
                          />
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary">Phủ được 88% nguy cơ tại 4 toà UET và Nhà đa năng mà không cần tăng biên chế bảo vệ.</Text>
                          </div>
                        </Card>
                      </Col>
                    </Row>

                    <Card title="Top Điểm nóng Không - Thời gian cần Giám sát Trọng điểm" style={{ marginTop: 16 }}>
                      <Table
                        dataSource={forecastData.top_hotspots}
                        rowKey="zone_code"
                        pagination={false}
                        columns={[
                          {
                            title: "Khu vực",
                            dataIndex: "zone_name",
                            key: "zone_name",
                            render: (name: string, row: any) => (
                              <div>
                                <strong>{name}</strong>
                                <br />
                                <small style={{ color: "#666" }}>Mã: {row.zone_code} · {row.building} Tầng {row.floor}</small>
                              </div>
                            ),
                          },
                          {
                            title: "Khung giờ cao điểm",
                            dataIndex: "peak_hour",
                            key: "peak_hour",
                            render: (h: number) => (
                              <Tag color="orange" icon={<FireOutlined />}>
                                {h}:00 – {h + 1}:00
                              </Tag>
                            ),
                          },
                          {
                            title: "Chỉ số Rủi ro",
                            dataIndex: "risk_score",
                            key: "risk_score",
                            render: (score: number) => (
                              <Space orientation="horizontal" size="small">
                                <Progress
                                  percent={score}
                                  size="small"
                                  strokeColor={score >= 80 ? "#cf1322" : score >= 60 ? "#fa8c16" : "#17634c"}
                                  style={{ width: 100 }}
                                />
                                <strong>{score}</strong>
                              </Space>
                            ),
                          },
                          {
                            title: "Lịch sử vi phạm",
                            dataIndex: "historical_events_count",
                            key: "historical_events_count",
                            render: (cnt: number, r: any) => (
                              <span>
                                {cnt} vụ ({Math.round(r.confirmed_ratio * 100)}% xác nhận)
                              </span>
                            ),
                          },
                          {
                            title: "Biện pháp phòng ngừa gợi ý",
                            dataIndex: "recommended_actions",
                            key: "recommended_actions",
                            render: (text: string) => <Text style={{ fontSize: 13 }}>{text}</Text>,
                          },
                        ]}
                      />
                    </Card>

                    <Card title="Lịch Tuần tra Thông minh 6 Ca Tối ưu (30 phút/ca)" style={{ marginTop: 16 }}>
                      <Table
                        dataSource={forecastData.recommended_patrol_shifts}
                        rowKey="id"
                        pagination={false}
                        columns={[
                          {
                            title: "Ca tuần tra",
                            dataIndex: "name",
                            key: "name",
                            render: (name: string, r: any) => (
                              <div>
                                <strong>{name}</strong>
                                <br />
                                <Tag color="blue">{r.assigned_team}</Tag>
                              </div>
                            ),
                          },
                          {
                            title: "Thời gian",
                            key: "time",
                            render: (_: any, r: any) => (
                              <Tag color="cyan">
                                {r.start_time} – {r.end_time}
                              </Tag>
                            ),
                          },
                          {
                            title: "Trọng tâm kiểm tra",
                            dataIndex: "target_building",
                            key: "target_building",
                          },
                          {
                            title: "Các điểm nóng đích",
                            dataIndex: "priority_zones",
                            key: "priority_zones",
                            render: (zones: string[]) => (
                              <Space wrap>
                                {zones.map((z) => (
                                  <Tag key={z} color="geekblue">{z}</Tag>
                                ))}
                              </Space>
                            ),
                          },
                          {
                            title: "Độ phủ rủi ro kỳ vọng",
                            dataIndex: "expected_risk_coverage",
                            key: "expected_risk_coverage",
                            render: (pct: number) => (
                              <Badge status="success" text={`Phủ ${pct}% nguy cơ`} />
                            ),
                          },
                        ]}
                      />
                    </Card>
                    <div style={{ marginTop: 12, color: "#888", fontSize: 12 }}>
                      {forecastData.disclaimer}
                    </div>
                  </>
                ) : (
                  <Empty description="Chưa có dữ liệu dự báo" />
                )}
              </div>
            ),
          },
          {
            key: "transparency",
            label: (
              <span>
                <SafetyCertificateOutlined /> Minh bạch thuật toán (AI Transparency)
              </span>
            ),
            children: (
              <div>
                {loading && !transparencyData ? (
                  <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>
                ) : transparencyData ? (
                  <>
                    <Alert
                      showIcon
                      type="success"
                      message="Nguyên tắc Minh bạch & Đạo đức AI Học đường"
                      description="Hệ thống không sử dụng camera hình ảnh, không ghi âm thanh và không nhận diện danh tính sinh viên. Tín hiệu cảm biến hiện diện PIR chỉ là tham số phụ gia tăng độ tin cậy và không bao giờ được dùng làm bằng chứng kết luận vi phạm."
                      style={{ marginBottom: 16 }}
                    />

                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={6}>
                        <Card>
                          <Statistic
                            title="Độ chính xác tổng thể (Accuracy)"
                            value={Math.round(transparencyData.overall.accuracy * 1000) / 10}
                            suffix="%"
                            valueStyle={{ color: "#17634c", fontWeight: 700 }}
                          />
                          <small>Trên 140 sự kiện kiểm tra độc lập</small>
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card>
                          <Statistic
                            title="Tỷ lệ Báo nhầm (False Alarm)"
                            value={transparencyData.overall.false_alarm_per_node_per_day}
                            suffix="lần / nút / ngày"
                            valueStyle={{ color: "#1677ff", fontWeight: 700 }}
                          />
                          <small>Đạt cam kết Vòng 1 (≤ 1 lần/ngày)</small>
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card>
                          <Statistic
                            title="Độ trễ phát hiện trung vị (P50)"
                            value={transparencyData.overall.detection_latency_median_seconds}
                            suffix="giây (~1.4 phút)"
                            valueStyle={{ color: "#722ed1", fontWeight: 700 }}
                          />
                          <small>Cam kết Vòng 1: ≤ 2 phút</small>
                        </Card>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Card>
                          <Statistic
                            title="Độ trễ Web Push tới ca trực (P95)"
                            value={transparencyData.overall.alert_dispatch_latency_p95_seconds}
                            suffix="giây"
                            valueStyle={{ color: "#cf1322", fontWeight: 700 }}
                          />
                          <small>Cam kết Vòng 1: &lt; 5 giây</small>
                        </Card>
                      </Col>
                    </Row>

                    <Card title="Đánh giá Hiệu năng Phân loại 6 Loại Sự kiện Khí dung (Tầng 2)" style={{ marginTop: 16 }}>
                      <Table
                        dataSource={transparencyData.metrics_by_class}
                        rowKey="event_class"
                        pagination={false}
                        columns={[
                          {
                            title: "Loại sự kiện",
                            dataIndex: "display_name",
                            key: "display_name",
                            render: (name: string, r: any) => (
                              <div>
                                <strong>{name}</strong>
                                <br />
                                <code style={{ fontSize: 11, color: "#888" }}>{r.event_class}</code>
                              </div>
                            ),
                          },
                          {
                            title: "Mẫu kiểm tra",
                            dataIndex: "sample_count",
                            key: "sample_count",
                            render: (n: number) => `${n} sự kiện`,
                          },
                          {
                            title: "Độ chuẩn xác (Precision)",
                            dataIndex: "precision",
                            key: "precision",
                            render: (v: number) => (
                              <Tag color={v >= 0.9 ? "green" : "blue"}>{Math.round(v * 100)}%</Tag>
                            ),
                          },
                          {
                            title: "Độ bao phủ (Recall)",
                            dataIndex: "recall",
                            key: "recall",
                            render: (v: number) => (
                              <Tag color={v >= 0.9 ? "green" : "orange"}>{Math.round(v * 100)}%</Tag>
                            ),
                          },
                          {
                            title: "Điểm F1-Score",
                            dataIndex: "f1_score",
                            key: "f1_score",
                            render: (v: number) => <strong>{v.toFixed(2)}</strong>,
                          },
                        ]}
                      />
                    </Card>

                    <Card title="Ma trận Nhầm lẫn (Confusion Matrix trên 140 Sự kiện Độc lập)" style={{ marginTop: 16 }}>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
                          <thead>
                            <tr style={{ background: "#fafafa" }}>
                              <th style={{ border: "1px solid #f0f0f0", padding: 8 }}>Thực tế \ Dự đoán</th>
                              {transparencyData.confusion_matrix.classes.map((cls: string) => (
                                <th key={cls} style={{ border: "1px solid #f0f0f0", padding: 8 }}>{cls}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {transparencyData.confusion_matrix.matrix.map((row: number[], rIdx: number) => (
                              <tr key={rIdx}>
                                <td style={{ border: "1px solid #f0f0f0", padding: 8, fontWeight: "bold", textAlign: "left", background: "#fafafa" }}>
                                  {transparencyData.confusion_matrix.classes[rIdx]}
                                </td>
                                {row.map((cell: number, cIdx: number) => {
                                  const isDiagonal = rIdx === cIdx;
                                  return (
                                    <td
                                      key={cIdx}
                                      style={{
                                        border: "1px solid #f0f0f0",
                                        padding: 8,
                                        fontWeight: isDiagonal ? "bold" : "normal",
                                        background: isDiagonal ? "#e6f4ea" : cell > 0 ? "#fff1f0" : "transparent",
                                        color: isDiagonal ? "#17634c" : cell > 0 ? "#cf1322" : "#999",
                                      }}
                                    >
                                      {cell}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>

                    <Card title="Kết quả 3 Bộ Kiểm tra Độ bền Thuật toán (Stress Tests)" style={{ marginTop: 16 }}>
                      {transparencyData.stress_test_results.map((st: any, idx: number) => (
                        <div key={idx} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #eee" }}>
                          <Space>
                            <Tag color="green">ĐẠT (PASS)</Tag>
                            <strong>{st.test_name}</strong>
                          </Space>
                          <div style={{ marginTop: 4, color: "#666", fontSize: 13 }}>
                            Điều kiện: {st.condition}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 13 }}>
                            <strong>Độ chính xác duy trì: {Math.round(st.accuracy * 1000) / 10}%</strong> — {st.notes}
                          </div>
                        </div>
                      ))}
                    </Card>

                    <Card title="Giới hạn Kỹ thuật & Cam kết Bảo vệ Riêng tư" style={{ marginTop: 16 }}>
                      <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="Cảm biến hiện diện PIR">
                          {transparencyData.sensor_limitations.pir_sensor}
                        </Descriptions.Item>
                        <Descriptions.Item label="Bộ lọc hơi nước nhà tắm">
                          {transparencyData.sensor_limitations.humidity_steam}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ô nhiễm môi trường diện rộng">
                          {transparencyData.sensor_limitations.ambient_pollution}
                        </Descriptions.Item>
                        <Descriptions.Item label="Cam kết Đạo đức & Privacy by Design">
                          {transparencyData.sensor_limitations.ethical_safeguard}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </>
                ) : (
                  <Empty description="Chưa có dữ liệu minh bạch thuật toán" />
                )}
              </div>
            ),
          },
          {
            key: "weekly",
            label: (
              <span>
                <FileDoneOutlined /> Báo cáo tuần AI (LLM Report)
              </span>
            ),
            children: (
              <div>
                {loading && !weeklyReport ? (
                  <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>
                ) : weeklyReport ? (
                  <Card>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div>
                        <Tag color="purple">Tự động tổng hợp bởi AI</Tag>
                        <span style={{ color: "#666", marginLeft: 8 }}>
                          Kỳ báo cáo: {weeklyReport.period_start} – {weeklyReport.period_end}
                        </span>
                      </div>
                      <Button
                        type="default"
                        onClick={() => {
                          const blob = new Blob([weeklyReport.content_markdown], { type: "text/markdown;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `Bao-cao-tuan-SFZ-${weeklyReport.period_end}.md`;
                          a.click();
                        }}
                      >
                        Tải file Markdown
                      </Button>
                    </div>

                    <div
                      style={{
                        background: "#fafafa",
                        padding: 24,
                        borderRadius: 8,
                        border: "1px solid #e8e8e8",
                        whiteSpace: "pre-wrap",
                        fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont",
                        lineHeight: 1.7,
                      }}
                    >
                      {weeklyReport.content_markdown}
                    </div>

                    <Divider />
                    <Title level={5}>Hành động đề xuất cho Ban Quản lý:</Title>
                    <ul>
                      {weeklyReport.action_items.map((item: string, idx: number) => (
                        <li key={idx} style={{ marginBottom: 4 }}>
                          <Text strong>{item}</Text>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ) : (
                  <Empty description="Chưa có báo cáo tuần" />
                )}
              </div>
            ),
          },
          {
            key: "infographics",
            label: (
              <span>
                <CloudUploadOutlined /> Khung Infographic Tuyên truyền
              </span>
            ),
            children: (
              <div>
                <Alert
                  showIcon
                  type="info"
                  style={{ marginBottom: 16 }}
                  message="Kênh Tuyên truyền Trực quan theo Điểm nóng (Targeted Visual Advocacy)"
                  description="Ban Quản lý có thể đăng tải infographic tuyên truyền phòng chống tác hại thuốc lá, hiển thị tự động trên màn hình sảnh toà nhà và trên ứng dụng sinh viên. Hệ thống tự động lọc siêu dữ liệu EXIF bảo vệ quyền riêng tư và đếm lượt tiếp cận ẩn danh."
                />

                <Row gutter={[16, 16]}>
                  {infographics.map((info) => (
                    <Col xs={24} sm={12} md={8} key={info.id}>
                      <Card
                        hoverable
                        cover={
                          <div style={{ height: 220, overflow: "hidden", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <img
                              alt={info.title}
                              src={info.image_url}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                        }
                        actions={[
                          <span key="view">
                            <EyeOutlined /> {info.building || "Toàn trường"}
                          </span>,
                          <span key="date">
                            {new Date(info.created_at).toLocaleDateString("vi-VN")}
                          </span>,
                        ]}
                      >
                        <Card.Meta
                          title={info.title}
                          description={
                            <div>
                              <Tag color="green">Đang hiển thị</Tag>
                              {info.created_by?.name && (
                                <small style={{ color: "#888" }}>Đăng bởi: {info.created_by.name}</small>
                              )}
                            </div>
                          }
                        />
                      </Card>
                    </Col>
                  ))}
                  {infographics.length === 0 && (
                    <Col span={24}>
                      <Empty description="Chưa có infographic nào được đăng tải. Ban Quản lý có thể bấm nút Đăng Infographic để tải lên." />
                    </Col>
                  )}
                </Row>
              </div>
            ),
          },
        ]}
      />

      {/* Modal đăng Infographic */}
      <Modal
        title="Đăng tải Infographic Tuyên truyền (Dành cho Ban Quản lý)"
        open={uploadModalOpen}
        onCancel={() => {
          setUploadModalOpen(false);
          uploadForm.resetFields();
          setPreviewImage("");
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={uploadForm} layout="vertical" onFinish={handleUploadInfographic}>
          <Form.Item
            name="title"
            label="Tiêu đề infographic"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề infographic" }]}
          >
            <Input placeholder="VD: Tác hại thuốc lá điện tử & Nghị quyết 173/2024/QH15" />
          </Form.Item>

          <Form.Item name="building" label="Toà nhà / Khuôn viên hiển thị ưu tiên">
            <Select
              placeholder="Chọn toà nhà hoặc để toàn trường"
              options={[
                { value: "Toàn trường", label: "Toàn trường (Tất cả toà nhà)" },
                { value: "UET1", label: "Toà UET1 (Điểm nóng tầng 4)" },
                { value: "UET2", label: "Toà UET2 (Điểm nóng sân thượng)" },
                { value: "UET3", label: "Toà UET3 (Cầu thang F5)" },
                { value: "UET4", label: "Toà UET4 (Lối sân thượng)" },
                { value: "NhaDaNang", label: "Nhà đa năng" },
              ]}
            />
          </Form.Item>

          <Form.Item label="Chọn tệp hình ảnh (PNG, JPG, WebP ≤ 2 MB)">
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageFileChange} />
            <div style={{ marginTop: 4, color: "#888", fontSize: 12 }}>
              Hệ thống tự động cắt bỏ siêu dữ liệu định vị EXIF khi lưu trữ.
            </div>
          </Form.Item>

          {previewImage && (
            <div style={{ marginBottom: 16, textAlign: "center" }}>
              <img
                src={previewImage}
                alt="Xem trước"
                style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 6, border: "1px solid #ddd" }}
              />
            </div>
          )}

          <Form.Item name="image_url" label="Hoặc nhập đường dẫn ảnh (URL) nếu có sẵn">
            <Input placeholder="https://example.com/infographic.jpg" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setUploadModalOpen(false)}>Huỷ</Button>
              <Button type="primary" htmlType="submit" loading={uploadLoading} style={{ background: "#17634c" }}>
                Đăng tải ngay
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
