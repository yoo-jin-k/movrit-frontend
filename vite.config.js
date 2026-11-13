/**
 * Vite 개발 서버 설정입니다.
 * 기본 실행(npm run dev)은 백엔드 8080으로, 통합 실행(npm run dev:integration)은 .env.integration 값에 따라
 * 백엔드 18080·프론트 5174로 /api 요청을 넘깁니다. 비밀값은 이 파일과 .env.* 파일에 넣지 않습니다.
 */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

export default defineConfig(({ mode }) => {
  // VITE_ 접두사가 없는 개발 서버 전용 값(MOVRIT_*)도 읽기 위해 접두사 필터 없이 불러옵니다.
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.MOVRIT_DEV_PORT) || undefined
  return {
    plugins: [react()],
    server: {
      port,
      strictPort: Boolean(port),
      proxy: {
        '/api': {
          target: env.MOVRIT_API_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
        // 브랜드·상품·캠페인 공개 이미지(/uploads/...)도 같은 백엔드에서 받습니다(배포 nginx.conf와 같은 경로 규칙).
        '/uploads': {
          target: env.MOVRIT_API_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  }
})
