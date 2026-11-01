/**
 * 로그인하지 않은 방문자도 사용할 수 있는 공개 캠페인·신청 폼 조회를 담당합니다.
 * 인증 갱신 인터셉터가 없는 클라이언트를 사용하며, 필요한 필드를 검증한 뒤 화면에 전달합니다.
 */
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

// 공개 모집 목록을 반환합니다. 카드 형태 정규화는 목록을 소비하는 어댑터에서 수행합니다.
export async function readCampaigns(signal) {
  return (await publicApi.get('/collaborations/campaigns/open', { signal }))
    .data
}
// 본문 응답의 최소 구조를 확인하되 상세 필드가 사라지지 않도록 원본 DTO를 반환합니다.
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
// 모집 현황(신청·선정·수락 인원)을 가볍게 다시 불러옵니다. 상세 화면이 주기적으로 호출합니다.
export async function readCampaignRecruitment(id, signal) {
  const { data } = await publicApi.get(
    `/collaborations/campaigns/${encodeURIComponent(id)}/recruitment`,
    { signal },
  )
  if (!data || typeof data.applicationCount !== 'number')
    throw new Error('모집 현황 응답 형식이 올바르지 않습니다.')
  return data
}
// 서버가 정의한 참여 방식·질문·동의 문서 구조를 검사한 뒤 실제 신청 화면에 전달합니다.
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
