import { Router } from "express";

export const docsRouter = Router();

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "VNU SmarT-Free Zone — Backend REST API",
    version: "1.0.0",
    description: `
**Hệ thống Giám sát & Tiếp nhận Báo cáo Khói thuốc — Trường ĐH Công nghệ (UET) Hoà Lạc**

- **Kiến trúc:** 4 tầng (IoT Edge -> Ingest Broker -> Backend Core Hub -> Client Platforms)
- **Hợp đồng dữ liệu:** Zod Schemas & TypeScript Type-Safe
- **Realtime:** Socket.IO & Web Push VAPID độ trễ < 1s
- **Tài khoản Demo:** \`bql\`, \`catruc\`, \`phantich\`, \`bgk\` (Mật khẩu: \`Demo@2026\`)
    `,
  },
  servers: [
    {
      url: "http://127.0.0.1:3001",
      description: "Local Development Server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Nhập Bearer token nhận được sau khi đăng nhập qua /api/auth/login",
      },
    },
  },
  paths: {
    // === AUTHENTICATION ===
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Đăng nhập 4 vai trò (bql, catruc, phantich, bgk)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string", example: "bql" },
                  password: { type: "string", example: "Demo@2026" },
                },
                required: ["username", "password"],
              },
            },
          },
        },
        responses: {
          200: { description: "Đăng nhập thành công, trả về token và thông tin user" },
          401: { description: "Sai thông tin đăng nhập" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Lấy thông tin tài khoản hiện tại từ token",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Thông tin tài khoản" },
          401: { description: "Chưa đăng nhập hoặc token hết hạn" },
        },
      },
    },

    // === REPORTS (SINH VIÊN) ===
    "/api/reports": {
      post: {
        tags: ["Reports (Sinh viên)"],
        summary: "Tiếp nhận phản ánh từ sinh viên qua mã QR (Tự động che PII & gộp nguồn 15p)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  zone_code: { type: "string", example: "UET1-3CT" },
                  type: {
                    type: "string",
                    enum: ["smoke_now", "smell", "vape", "butts", "other"],
                    example: "smoke_now",
                  },
                  ongoing: { type: "boolean", example: true },
                  emergency: { type: "boolean", example: false },
                  note: { type: "string", example: "Có người hút thuốc ở chiếu nghỉ cầu thang" },
                  device_token: { type: "string", example: "anon_dev_token_12345" },
                  source: { type: "string", enum: ["qr_app", "form2_trial", "other"], example: "qr_app" },
                  is_trial: { type: "boolean", example: false },
                },
                required: ["zone_code", "type", "device_token"],
              },
            },
          },
        },
        responses: {
          201: { description: "Tiếp nhận thành công, trả về mã tra cứu ngẫu nhiên (VD: K7Q2-9XMA)" },
        },
      },
    },
    "/api/reports/track/{code}": {
      get: {
        tags: ["Reports (Sinh viên)"],
        summary: "Tra cứu tiến độ xử lý và thông điệp cảm ơn qua mã ngẫu nhiên",
        parameters: [
          {
            name: "code",
            in: "path",
            required: true,
            schema: { type: "string", example: "K7Q2-9XMA" },
            description: "Mã tra cứu ngẫu nhiên cấp cho sinh viên",
          },
        ],
        responses: {
          200: { description: "Thông tin tiến độ phản ánh và thông điệp từ BQL" },
          404: { description: "Mã tra cứu không tồn tại" },
        },
      },
    },

    // === TICKETS & SLA ===
    "/api/tickets": {
      get: {
        tags: ["Tickets (Phiếu & SLA)"],
        summary: "Danh sách phiếu sự cố có phân quyền vai trò (Guard, BQL, Analyst, BGK)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "zone_code", in: "query", schema: { type: "string" }, description: "Lọc theo mã khu vực" },
          { name: "status", in: "query", schema: { type: "string" }, description: "Lọc theo trạng thái" },
          { name: "is_trial", in: "query", schema: { type: "boolean" }, description: "Lọc phiếu thử nghiệm Form 2" },
        ],
        responses: {
          200: { description: "Danh sách phiếu sự cố" },
        },
      },
    },
    "/api/tickets/overdue": {
      get: {
        tags: ["Tickets (Phiếu & SLA)"],
        summary: "Danh sách phiếu quá hạn SLA 15 phút (Cần BQL can thiệp khẩn cấp)",
        responses: {
          200: { description: "Danh sách phiếu quá hạn" },
        },
      },
    },
    "/api/tickets/{code}": {
      get: {
        tags: ["Tickets (Phiếu & SLA)"],
        summary: "Chi tiết phiếu sự cố kèm lịch sử audit log 6 bước",
        parameters: [
          { name: "code", in: "path", required: true, schema: { type: "string", example: "SF-DEMO-001" } },
        ],
        responses: {
          200: { description: "Chi tiết phiếu, khu vực và lịch sử chuyển trạng thái" },
        },
      },
    },
    "/api/tickets/{code}/status": {
      patch: {
        tags: ["Tickets (Phiếu & SLA)"],
        summary: "Chuyển trạng thái phiếu tuân theo máy trạng thái 6 bước (FSM)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "code", in: "path", required: true, schema: { type: "string", example: "SF-DEMO-001" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["assigned", "verifying", "handled", "responded", "closed"],
                    example: "verifying",
                  },
                  note: { type: "string", example: "Ca trực đang tiếp cận hiện trường kiểm tra" },
                  assignee_id: { type: "string", example: "usr_catruc" },
                },
                required: ["status"],
              },
            },
          },
        },
        responses: {
          200: { description: "Cập nhật trạng thái thành công" },
          400: { description: "Chuyển trạng thái vi phạm máy trạng thái hữu hạn" },
          403: { description: "Không đủ thẩm quyền vai trò" },
        },
      },
    },

    // === ZONES & SENSORS ===
    "/api/zones": {
      get: {
        tags: ["Zones (Khu vực UET Hoà Lạc)"],
        summary: "Danh mục 25 khu vực UET Hoà Lạc (UET1-4, Nhà ĐN, 3 Cổng) và 10 cảm biến IoT",
        responses: {
          200: { description: "Danh sách khu vực kèm toạ độ sơ đồ mặt bằng và trạng thái cảm biến" },
        },
      },
    },

    // === SANDBOX (BAN GIÁM KHẢO) ===
    "/api/sandbox/ticket": {
      post: {
        tags: ["Sandbox (Ban Giám Khảo)"],
        summary: "BGK tạo phiếu thử nghiệm độc lập trong Sandbox (tự xoá sau 30 phút)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  zone_code: { type: "string", example: "UET1-3CT" },
                  priority: { type: "string", enum: ["low", "normal", "high", "urgent"], example: "high" },
                  presence: { type: "boolean", example: true },
                },
                required: ["zone_code"],
              },
            },
          },
        },
        responses: {
          201: { description: "Tạo phiếu thử nghiệm sandbox thành công" },
        },
      },
    },
    "/api/sandbox/reset": {
      post: {
        tags: ["Sandbox (Ban Giám Khảo)"],
        summary: "Nút Đặt lại Sandbox: Xoá sạch toàn bộ phiếu thử nghiệm của BGK",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Đặt lại sandbox thành công, dữ liệu thật không bị ảnh hưởng" },
        },
      },
    },

    // === INFOGRAPHICS ===
    "/api/infographics": {
      get: {
        tags: ["Infographics (Tuyên truyền)"],
        summary: "Lấy danh sách infographic tuyên truyền trường học không khói thuốc",
        responses: {
          200: { description: "Danh sách infographic" },
        },
      },
      post: {
        tags: ["Infographics (Tuyên truyền)"],
        summary: "Ban Quản lý đăng infographic (giới hạn <= 2MB, tự động xoá EXIF)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", example: "Thông điệp UET Xanh Hoà Lạc" },
                  image_url: { type: "string", example: "/assets/infographics/poster.png" },
                  image_data: { type: "string", description: "Base64 data ảnh JPEG (sẽ tự động strip EXIF)" },
                  building: { type: "string", example: "UET1" },
                },
                required: ["title"],
              },
            },
          },
        },
        responses: {
          201: { description: "Đăng tải infographic thành công" },
          403: { description: "Chỉ Ban Quản lý mới có quyền đăng" },
        },
      },
    },

    // === TELEMETRY & INGEST ===
    "/api/telemetry": {
      post: {
        tags: ["Telemetry (Cảm biến IoT)"],
        summary: "Ingest bản tin cảm biến IoT (5s/lần) & Kích hoạt bộ lọc khói Tầng 1",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  node_id: { type: "string", example: "UET1-3CT" },
                  seq: { type: "integer", example: 1042 },
                  ts: { type: "string", example: new Date().toISOString() },
                  pm1: { type: "number", example: 12.4 },
                  pm25: { type: "number", example: 68.5 },
                  pm10: { type: "number", example: 75.1 },
                  nc: { type: "number", example: 820 },
                  typ_size: { type: "number", example: 0.8 },
                  temp: { type: "number", example: 26.5 },
                  rh: { type: "number", example: 65.0 },
                  presence: { type: "boolean", example: true },
                  presence_age: { type: "integer", example: 3 },
                  rssi: { type: "integer", example: -58 },
                  fw: { type: "string", example: "0.3.0" },
                },
                required: ["node_id", "seq", "pm25", "temp", "rh"],
              },
            },
          },
        },
        responses: {
          200: { description: "Tiếp nhận bản tin thành công, tự động mở phiếu nếu phát hiện bất thường" },
        },
      },
    },

    // === NOTIFICATIONS ===
    "/api/notify/vapid-public-key": {
      get: {
        tags: ["Notifications (Web Push)"],
        summary: "Lấy khoá VAPID Public Key để đăng ký thông báo đẩy cho điện thoại ca trực",
        responses: {
          200: { description: "VAPID Public Key" },
        },
      },
    },
    "/api/notify/test": {
      post: {
        tags: ["Notifications (Web Push)"],
        summary: "Bắn thử nghiệm cảnh báo đẩy Web Push tới điện thoại ca trực",
        responses: {
          200: { description: "Gửi cảnh báo thành công" },
        },
      },
    },

    // === ADMIN & ROLLING DATES ===
    "/api/admin/roll-dates": {
      post: {
        tags: ["Admin"],
        summary: "Kích hoạt tự động dời ngày (Rolling Dates) để tuần gần nhất luôn kết thúc vào hôm nay",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Dời ngày thành công" },
        },
      },
    },

    // === SYSTEM MONITORING ===
    "/api/health": {
      get: {
        tags: ["System Monitoring"],
        summary: "Kiểm tra tình trạng hoạt động (Health check)",
        responses: {
          200: { description: "Trạng thái ok" },
        },
      },
    },
    "/api/health/detailed": {
      get: {
        tags: ["System Monitoring"],
        summary: "Giám sát chi tiết Uptime, RAM, Trạng thái CSDL (UptimeRobot)",
        responses: {
          200: { description: "Thông số giám sát hệ thống" },
        },
      },
    },
  },
};

// Endpoint trả về JSON OpenAPI spec
docsRouter.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

// Endpoint hiển thị giao diện tương tác Swagger UI y hệt FastAPI
docsRouter.get("/", (_req, res) => {
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>VNU SmarT-Free Zone — API Documentation (Swagger UI)</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5/favicon-32x32.png" />
  <style>
    body { margin: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .topbar { background-color: #0f172a !important; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .custom-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #10b981;
    }
    .custom-header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .custom-header p { margin: 4px 0 0; font-size: 13px; color: #94a3b8; }
    .badge-pill {
      background: #10b981;
      color: white;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="custom-header">
    <div>
      <h1>🌿 VNU SmarT-Free Zone — API Documentation</h1>
      <p>Trường Đại học Công nghệ (UET) — ĐHQGHN tại Hoà Lạc</p>
    </div>
    <div>
      <span class="badge-pill">OpenAPI 3.0 · Swagger UI</span>
    </div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        spec: ${JSON.stringify(openApiSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: -1,
        docExpansion: "list"
      });
    };
  </script>
</body>
</html>`;

  res.send(html);
});
