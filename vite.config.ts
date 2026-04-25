import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  base: '/wedding-app/',
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('naive-ui')) return 'vendor-ui'
          if (id.includes('@vueuse')) return 'vendor-vueuse'
          if (id.includes('node_modules')) return 'vendor-vue'
        },
      },
    },
  },
})
