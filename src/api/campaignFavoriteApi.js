/**
 * 로그인한 회원의 캠페인 찜 API입니다.
 * 추가·해제는 여러 번 호출해도 결과가 같으며(서버가 중복을 무시), 성공 응답 본문은 없습니다.
 */
import api from './axios'

// 찜한 캠페인 목록: [{ favoritedAt, campaign: 공개 목록과 같은 캠페인 응답 }]
export const getFavoriteCampaigns = async () =>
  (await api.get('/members/me/favorite-campaigns')).data
// 카드의 하트 표시용 찜한 캠페인 ID 목록
export const getFavoriteCampaignIds = async () =>
  (await api.get('/members/me/favorite-campaigns/ids')).data
export const addFavoriteCampaign = (campaignId) =>
  api.put(`/members/me/favorite-campaigns/${campaignId}`)
export const removeFavoriteCampaign = (campaignId) =>
  api.delete(`/members/me/favorite-campaigns/${campaignId}`)
