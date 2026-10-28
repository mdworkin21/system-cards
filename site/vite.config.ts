import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/system-cards/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": decodeURIComponent(new URL("./src", import.meta.url).pathname) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
  },
});
