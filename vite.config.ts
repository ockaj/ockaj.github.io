import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import checker from "vite-plugin-checker";
import compression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";
import { boneyardPlugin } from "boneyard-js/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    boneyardPlugin(),

    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
    checker({
      typescript: {
        tsconfigPath: "./tsconfig.app.json",
      },
      overlay: {
        initialIsOpen: false,
        position: "br",
      },
      terminal: true,
      enableBuild: false,
    }),
    compression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 10240,
    }),
    mode === "analyze" &&
      visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),

  build: {
    minify: true,
    target: "es2023",
    sourcemap: false,
    cssCodeSplit: true,
    cssMinify: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor-aurora",
              test: /Aurora\.tsx/,
            },
            {
              name: "vendor-motion",
              test: /node_modules[\\/]motion/,
            },
            {
              name: "vendor-base-ui",
              test: /node_modules[\\/]@base-ui/,
            },
            {
              name: "vendor-react",
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            },
          ],
        },
      },
    },
  },
  css: {
    transformer: "lightningcss",
  },
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    warmup: {
      clientFiles: ["./src/main.tsx", "./src/App.tsx", "./src/index.css"],
    },
  },
}));
