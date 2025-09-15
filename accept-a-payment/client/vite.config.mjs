import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    port: 3000,
    host: "0.0.0.0",
    proxy: {
        '/api': {
          target: 'http://localhost:4242',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
    }
  },
  build: {
    outDir: "build",
  },
})
