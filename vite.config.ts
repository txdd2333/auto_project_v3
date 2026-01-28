import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // 允许非 localhost 访问
    allowedHosts: [
      'tianji8888.xq0.cn' // 放行内网穿透域名
    ]
  },
  optimizeDeps: {
    include: [
      'mammoth',
      'turndown',
      'marked',
      'docx',
      'file-saver',
      '@logicflow/core',
      '@logicflow/extension'
    ]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdfjs': ['pdfjs-dist']
        }
      }
    }
  }
})
