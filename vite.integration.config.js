import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './vite.config.js'

// 기존 5173 개발 화면과 분리하여 격리된 통합 API 서버만 조회합니다.
export default mergeConfig(
  baseConfig,
  defineConfig({
    server: {
      host: '127.0.0.1',
      port: 5174,
      strictPort: true,
      proxy: {
        '/api': { target: 'http://localhost:18080', changeOrigin: true },
      },
    },
  }),
)
