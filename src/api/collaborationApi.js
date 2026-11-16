/**
 * 활동 프로필·캠페인·협업 제안·성과 조회의 기존 API를 묶습니다.
 * 협업 상태 전이와 추천 유입 기록은 각각 별도 요청이며 소유권 및 전이 허용 여부는 서버가 검사합니다.
 */
import api from './axios'
export const getMyCreator = async () => (await api.get('/creators/me')).data
// 기존 프로필 유무에 따라 생성과 내 프로필 수정을 선택합니다. 가입 권한을 새로 부여하는 분기는 아닙니다.
export const saveCreator = async (data, exists) =>
  (
    await api[exists ? 'put' : 'post'](
      exists ? '/creators/me' : '/creators',
      data,
    )
  ).data
export const getCreators = async () => (await api.get('/creators')).data
export const getOpenCampaigns = async () =>
  (await api.get('/collaborations/campaigns/open')).data
export const getSellerCampaigns = async () =>
  (await api.get('/collaborations/campaigns/seller')).data
export const createCampaign = async (data) =>
  (await api.post('/collaborations/campaigns', data)).data
// 기존 메시지 전용 신청 경로입니다. 버전·질문·동의를 포함한 실제 폼 신청은 LiveApplicationForm의 별도 경로를 사용합니다.
export const applyCampaign = async (id, message) =>
  (await api.post(`/collaborations/campaigns/${id}/apply`, { message })).data
export const propose = async (data) =>
  (await api.post('/collaborations/proposals', data)).data
export const getMyCollaborations = async () =>
  (await api.get('/collaborations/mine')).data
export const getSellerCollaborations = async () =>
  (await api.get('/collaborations/seller')).data
export const collaborationAction = async (id, action) =>
  (await api.patch(`/collaborations/${id}/${action}`)).data
// 추천 코드의 클릭 기록을 전송합니다. 이 요청 자체가 주문 생성이나 추천 성과 확정을 수행하지는 않습니다.
export const trackReferral = async (code, data) =>
  api.post(`/collaborations/referrals/${code}/click`, data)
export const getMyPerformance = async () =>
  (await api.get('/collaborations/performance/mine')).data
export const getSellerPerformance = async () =>
  (await api.get('/collaborations/performance/seller')).data

// 업체 본인 캠페인 목록입니다(성과 카드의 캠페인 선택용). 화면이 떠나면 signal로 요청을 취소합니다.
export async function readSellerCampaigns(signal) {
  const { data } = await api.get('/collaborations/campaigns/seller', {
    signal,
    timeout: 15000,
  })
  return Array.isArray(data) ? data : []
}

const contactPath = (campaignId) =>
  `/collaborations/campaigns/${encodeURIComponent(campaignId)}/contact`

// 캠페인 담당자 연락처 조회·저장입니다(업체 본인 캠페인만, 다른 업체면 403).
export async function readCampaignContact(campaignId, signal) {
  const { data } = await api.get(contactPath(campaignId), {
    signal,
    timeout: 15000,
  })
  return data || null
}
export async function saveCampaignContact(campaignId, { name, phone }) {
  const { data } = await api.put(
    contactPath(campaignId),
    { name, phone },
    { timeout: 15000 },
  )
  return data
}
