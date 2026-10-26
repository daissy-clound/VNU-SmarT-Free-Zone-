// Chuẩn bị CSDL SQLite cho backend: tạo backend/.env (nếu chưa có), sinh Prisma Client,
// đồng bộ schema và nạp dữ liệu demo. Chạy lặp an toàn (seed dùng upsert).
// --if-missing: bỏ qua khi CSDL và Prisma Client đã có (dùng trước `npm run dev`).
import { copyFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backend = join(dirname(fileURLToPath(import.meta.url)), "..", "backend");
const env = join(backend, ".env");
const ready =
  existsSync(env) &&
  existsSync(join(backend, "prisma", "dev.db")) &&
  existsSync(join(backend, "..", "node_modules", ".prisma", "client", "index.js"));
if (process.argv.includes("--if-missing") && ready) process.exit(0);
if (!existsSync(env)) {
  copyFileSync(join(backend, ".env.example"), env);
  console.log("[setup] Đã tạo backend/.env từ .env.example");
}
const run = (cmd) => execSync(cmd, { cwd: backend, stdio: ["ignore", "ignore", "inherit"] });
run("npx prisma generate");
run("npx prisma db push --skip-generate");
run("npx tsx prisma/seed.ts");
console.log("[setup] CSDL sẵn sàng (backend/prisma/dev.db)");
