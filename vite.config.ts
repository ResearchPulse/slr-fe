import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL?.replace(/\/$/, '')
  const backendUrl =
    env.VITE_BE_URL?.replace(/\/$/, '') ||
    apiUrl?.replace(/\/api$/, '') ||
    'http://localhost:5000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/hubs': {
          target: backendUrl,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})
