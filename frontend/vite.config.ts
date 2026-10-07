import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/notifications/stream': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '^/(auth|movies|rate|favorite|watched|custom-lists|stats|notifications|lms-filmes|lmsfilmes|lms-rating|lmsrating|lms-favorite|lmsfavorite)': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    }
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query', 'axios', 'zustand'],
          'vendor-ui': ['lucide-react', 'sonner', 'canvas-confetti'],
        },
      },
    },
  },
})
