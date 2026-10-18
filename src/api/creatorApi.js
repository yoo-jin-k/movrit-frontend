/**
 * 기존 활동 프로필과 대시보드·캠페인 응답 API를 제공합니다.
 * 다른 API 래퍼와 달리 Axios 응답 전체를 반환하므로 호출부에서 data를 꺼내 사용합니다.
 */
import api from './axios'

export const applyCreator = (payload) => api.post('/creators/apply', payload)
export const getMyCreatorProfile = () => api.get('/creators/me')
export const updateMyCreatorProfile = (payload) =>
  api.put('/creators/me', payload)
export const getCreatorDashboard = () => api.get('/creators/me/dashboard')
export const updateCreatorCampaignStatus = (campaignId, status) =>
  api.patch(`/creators/me/campaigns/${campaignId}/status`, { status })
