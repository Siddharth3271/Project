import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "terser",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          icons: ["lucide-react"]
        }
      }
    }
  },
  preview: {
    open: true
  },
  server: {
    proxy: {
      // Whenever React asks for /api, Vite secretly routes it to your Docker server
      '/api': {
        target: 'http://127.0.0.1:2000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
