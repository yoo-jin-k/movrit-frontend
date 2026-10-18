/**
 * 실제 편집 화면과 공개 상세 화면에 주입할 활성 미디어 클라이언트를 구성합니다.
 * 관리 요청에는 인증 클라이언트, 공개 표시정보에는 인증 갱신 없는 클라이언트를 사용합니다.
 */
import axios from 'axios'
import authenticated from './axios'
import { createCampaignMediaApi } from './campaignMediaApi'

// 로컬 통합 서버 562ffff의 미디어 테이블·API 반영 확인 후 활성화합니다.
const publicClient = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
})
export const liveCampaignMediaApi = createCampaignMediaApi({
  authenticated,
  publicClient,
  enabled: true,
})
