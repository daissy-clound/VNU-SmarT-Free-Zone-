export {};
const base = process.env.API_URL || "http://127.0.0.1:3001";
const response = await fetch(`${base}/api/reports`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    zone_code: process.argv[2] || "B5-CTD",
    type: "smoke_now",
    ongoing: true,
    emergency: false,
    note: "Phản ánh kiểm thử tích hợp của B",
    device_token: `demo-${Date.now()}`,
  }),
});
console.log(response.status, await response.json());
if (!response.ok) process.exitCode = 1;
