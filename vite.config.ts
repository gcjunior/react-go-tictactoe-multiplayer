import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // React dev server
    strictPort: true,
    proxy: {
      // Forward WebSocket requests to Go backend
      "/ws": {
        target: "http://localhost:8080",
        ws: true,
      },
      // Optional: forward API requests if you add REST endpoints
      "/api": "http://localhost:8080",
    },
  },
})
