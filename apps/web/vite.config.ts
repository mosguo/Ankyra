import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  resolve: {
    alias: {
      "@web": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 4173,
  },
  build: {
    outDir: path.resolve(__dirname, "../../dist/apps/web"),
    emptyOutDir: true,
  },
});
