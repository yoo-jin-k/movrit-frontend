/**
 * 로그인하지 않은 방문자도 사용할 수 있는 공개 캠페인·신청 폼 조회를 담당합니다.
 * 인증 갱신 인터셉터가 없는 클라이언트를 사용하며, 필요한 필드를 검증한 뒤 화면에 전달합니다.
 */
import axios from 'axios'
import {
  adaptCampaignList,
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
// 서버 검색 한 페이지입니다. 조건·정렬·페이지는 서버가 적용하고, 카드 모델 변환까지 마쳐 돌려줍니다.
export async function readCampaignPage(params, signal) {
  const { data } = await publicApi.get('/collaborations/campaigns/search', {
    params,
    signal,
  })
  if (!data || !Array.isArray(data.items))
    throw new Error('캠페인 목록 응답 형식이 올바르지 않습니다.')
  return {
    items: adaptCampaignList(data.items),
    page: data.page,
    totalPages: data.totalPages,
    total: data.total,
  }
}
// 로그인 중이면 접근 토큰을 돌려줍니다. 저장소를 쓸 수 없는 환경이면 비로그인으로 봅니다.
function currentAccessToken() {
  try {
    return sessionStorage.getItem('accessToken')
  } catch {
    return null
  }
}

// 본문 응답의 최소 구조를 확인하되 상세 필드가 사라지지 않도록 원본 DTO를 반환합니다.
// 운영자가 숨긴 캠페인은 소유 업체·운영자·신청자에게만 보이므로, 로그인 중이면 접근 토큰을 함께 보냅니다.
// 토큰이 만료돼 401이 오면 토큰 없이 한 번 더 조회해 공개 캠페인은 그대로 보이게 합니다.
export async function readCampaign(id, signal) {
  const url = `/collaborations/campaigns/${encodeURIComponent(id)}`
  const token = currentAccessToken()
  let response
  try {
    response = await publicApi.get(url, {
      signal,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  } catch (error) {
    if (!token || error.response?.status !== 401) throw error
    response = await publicApi.get(url, { signal })
  }
  adaptCampaignSummary(response.data)
  return response.data
}
// 신청을 마치면 신청 영역이 이 이름의 이벤트로 알려, 모집 현황이 15초를 기다리지 않고 바로 다시 불러옵니다.
export const CAMPAIGN_APPLIED_EVENT = 'movrit:campaign-applied'

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
