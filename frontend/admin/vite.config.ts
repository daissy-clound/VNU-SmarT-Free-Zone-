import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, transformWithEsbuild, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const swSource = fileURLToPath(new URL("./src/sw.ts", import.meta.url));

/**
 * Dựng src/sw.ts thành /sw.js ở gốc site: service worker phải nằm ở "/" để
 * quản lý mọi trang (bấm thông báo mở /tickets/<mã>). Dev phục vụ trực tiếp, build xuất file.
 */
function serviceWorker(): Plugin {
  const compile = async () =>
    (await transformWithEsbuild(await readFile(swSource, "utf8"), swSource, { loader: "ts", format: "esm", target: "es2020" })).code;
  return {
    name: "sfz-service-worker",
    configureServer(server) {
      server.middlewares.use("/sw.js", async (_req, res) => {
        res.setHeader("Content-Type", "text/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.end(await compile());
      });
    },
    async generateBundle() {
      this.emitFile({ type: "asset", fileName: "sw.js", source: await compile() });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.API_PROXY_TARGET || "http://127.0.0.1:3001";
  const proxy = {
    "/api": { target, changeOrigin: true },
    "/socket.io": { target, ws: true, changeOrigin: true },
  };
  return {
    plugins: [react(), serviceWorker()],
    server: {
      port: 5173,
      strictPort: true,
      proxy,
    },
    preview: { proxy },
    build: {
      chunkSizeWarningLimit: 1100,
      rollupOptions: {
        output: {
          manualChunks: {
            ui: ["antd", "@ant-design/icons"],
            react: ["react", "react-dom", "react-router-dom"],
            transport: ["socket.io-client"],
            validation: ["zod"],
          },
        },
      },
    },
  };
});
