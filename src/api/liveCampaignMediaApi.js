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
