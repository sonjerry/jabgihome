// client/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',                 // 서브경로 배포가 아니라면 무조건 '/'
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'tiptap': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-text-style',
            '@tiptap/extension-color',
            '@tiptap/extension-link',
            '@tiptap/extension-image',
            '@tiptap/extension-text-align'
          ]
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-text-style',
      '@tiptap/extension-color',
      '@tiptap/extension-link',
      '@tiptap/extension-image',
      '@tiptap/extension-text-align'
    ]
  }
})
