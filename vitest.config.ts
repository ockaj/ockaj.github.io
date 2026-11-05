import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { createMdxPlugin } from "./vite/mdxPlugin.ts";

export default defineConfig({
  plugins: [createMdxPlugin(), react()],
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/__tests__/**",
        "src/data/articles/**",
        "src/data/caseStudies/**",
      ],
      thresholds: {
        lines: 55,
        branches: 55,
        functions: 60,
        statements: 55,
      },
    },
  },
});
