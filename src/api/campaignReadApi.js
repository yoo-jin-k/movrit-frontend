import axios from 'axios'
import {
  adaptCampaignSummary,
  validateCampaignForm,
} from '../features/discovery/campaignReadAdapter'

// 공개 조회에는 JWT 갱신·강제 로그인 이동을 적용하지 않습니다. 쓰기 API는 이 클라이언트에 두지 않습니다.
const publicApi = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
})

export async function readCampaigns(signal) {
  return (await publicApi.get('/collaborations/campaigns/open', { signal }))
    .data
}
export async function readCampaign(id, signal) {
  const { data } = await publicApi.get(
    `/collaborations/campaigns/${encodeURIComponent(id)}`,
    {
      signal,
    },
  )
  adaptCampaignSummary(data)
  return data
}
export async function readCampaignForm(id, signal) {
  const { data } = await publicApi.get(
    `/campaigns/${encodeURIComponent(id)}/application-form`,
    {
      signal,
    },
  )
  return validateCampaignForm(data)
}

// 실제 Problem Detail 안내와 HTTP 상태를 보존하며 오류를 예시 결과로 대체하지 않습니다.
export function campaignReadError(error) {
  const status = error.response?.status
  const fallback =
    status === 404
      ? '캠페인 또는 신청 조건을 찾을 수 없습니다.'
      : status === 401
        ? '조회에 필요한 인증을 확인해 주세요.'
        : status === 403
          ? '이 정보를 조회할 권한이 없습니다.'
          : '캠페인 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  return typeof error.response?.data?.detail === 'string'
    ? error.response.data.detail
    : fallback
}
