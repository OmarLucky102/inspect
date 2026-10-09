import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Admin panel: Vite + React + Tailwind v4.
// API base comes from VITE_API_URL (see .env). Cookie auth requires
// credentials:include on the client and CORS allowlist on the API.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
  },
})
