import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: {
      '/adminService': {
        target: 'https://cloud1-2gyakmjl948dda68-1393736980.ap-shanghai.app.tcloudbase.com',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
