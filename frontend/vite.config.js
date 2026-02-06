// frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
    plugins: [
        react(),
        wasm(),
        topLevelAwait()
    ],
    server: {
        host: true,
        port: 5173,
        proxy: {
            "/api": {
                target: "http://backend:8000",
                changeOrigin: true,
            },
        },
    },
    optimizeDeps: {
        exclude: ['argon2-browser']
    }
});