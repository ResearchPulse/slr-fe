import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://159.223.68.238:8080',
        changeOrigin: true,
      },
      '/hubs': {
        target: 'http://159.223.68.238:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
