import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { ProxyOptions } from 'vite'

/**
 * Same-origin /api/* must resolve in every local setup:
 * - Browser on :3000 → Next.js landing API routes
 * - Browser on :5173 → Vite proxies /api → landing (:3000)
 *
 * Never point this at :8787 (legacy vercel-dev port) unless that process is running.
 */
// Prefer IPv4 — on Windows `localhost` can resolve to ::1 while Next binds 127.0.0.1.
const API_PROXY_TARGET =
  process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3000'

const apiProxy: ProxyOptions = {
  target: API_PROXY_TARGET,
  changeOrigin: true,
  secure: false,
  configure(proxy) {
    proxy.on('error', (err, _req, res) => {
      console.error(
        `[vite] /api proxy → ${API_PROXY_TARGET} failed:`,
        err.message,
        '\n  Start the landing app (pnpm dev on :3000) or set VITE_API_PROXY_TARGET.',
      )
      if (res && 'writeHead' in res && typeof res.writeHead === 'function' && !res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            error: `API proxy unreachable (${API_PROXY_TARGET}). Start the landing Next.js app or set VITE_API_PROXY_TARGET.`,
          }),
        )
      }
    })
  },
}

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['pdfjs-dist', 'mammoth'],
  },
  server: {
    port: 5173,
    strictPort: true,
    // Listen on IPv4 so the Next.js landing proxy (localhost→127.0.0.1 on Windows)
    // does not get ECONNREFUSED / Internal Server Error when Vite only binds [::1].
    host: '127.0.0.1',
    // When the SPA is opened via the landing proxy (localhost:3000), absolute
    // module URLs and HMR must stay on that origin or deps like pdfjs break.
    origin: process.env.VITE_DEV_ORIGIN || 'http://localhost:3000',
    hmr: {
      host: 'localhost',
      protocol: 'ws',
      clientPort: Number(process.env.VITE_HMR_CLIENT_PORT || 3000),
    },
    proxy: {
      '/api': apiProxy,
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
    proxy: {
      '/api': apiProxy,
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'tutor-assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'pdf-vendor': ['pdfjs-dist'],
        },
      },
    },
  },
})
