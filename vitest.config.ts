import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { createMdxPlugin } from "./vite/mdxPlugin.ts";

export default defineConfig({
  plugins: [createMdxPlugin(), react()],
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.{test,spec}.{ts,tsx}"],
  },
});
