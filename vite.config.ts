import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('docx')) return 'vendor-docx'
          if (id.includes('jspdf')) return 'vendor-jspdf'
          if (id.includes('html2canvas')) return 'vendor-html2canvas'
          if (id.includes('dompurify')) return 'vendor-purify'
          if (id.includes('quill') || id.includes('parchment')) return 'vendor-editor'
          if (id.includes('lucide-react') || id.includes('lucide')) return 'vendor-icons'
          if (id.includes('date-fns')) return 'vendor-date'
          if (id.includes('zod')) return 'vendor-zod'
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (id.includes('@tanstack')) return 'vendor-query'
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react'
          if (id.includes('framer-motion')) return 'vendor-motion'
          return 'vendor'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
