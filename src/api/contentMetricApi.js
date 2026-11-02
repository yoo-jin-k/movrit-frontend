/**
 * 콘텐츠 성과(조회수·좋아요·댓글 수) API입니다.
 * 참여자와 캠페인 업체가 게시물에서 확인한 숫자를 날짜별로 기록하고, 업체는 캠페인 전체 합계를 봅니다.
 */
import api from './axios'

const path = (submissionId) =>
  `/campaign-contents/${encodeURIComponent(submissionId)}/metrics`

export async function readContentMetrics(submissionId, signal) {
  const { data } = await api.get(path(submissionId), { signal, timeout: 15000 })
  return data
}

// 하루치 숫자를 저장합니다. 같은 게시물·같은 날짜는 고쳐 씁니다. 바뀐 전체 기록을 돌려받습니다.
export async function recordContentMetric(submissionId, body) {
  const { data } = await api.put(path(submissionId), body, { timeout: 15000 })
  return data
}

export async function readCampaignPerformance(campaignId, signal) {
  const { data } = await api.get(
    `/campaigns/${encodeURIComponent(campaignId)}/content-performance`,
    { signal, timeout: 15000 },
  )
  return data
}
