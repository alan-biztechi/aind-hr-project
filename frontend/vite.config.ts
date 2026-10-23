import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// 백엔드 API 프록시 대상 (로컬 Spring Boot 기본 포트)
const API_TARGET = process.env.VITE_PROXY_TARGET ?? "http://localhost:8080";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // 개발 환경에서 /v1 요청을 백엔드로 프록시하여 CORS 이슈를 회피한다.
    proxy: {
      "/v1": {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
});
