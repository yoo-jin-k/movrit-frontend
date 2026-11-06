/**
 * 업체 캠페인 작성 화면의 AI 초안 요청입니다.
 * AI 키는 서버만 가지고 있으며, 화면은 서버에 초안을 요청하고 답 형식만 확인합니다.
 */
import api from './axios'

// AI가 글을 쓰는 동안 기다릴 수 있도록 일반 요청보다 길게 기다립니다.
export async function requestCampaignDraft(request) {
  const { data } = await api.post('/campaigns/ai/draft', request, {
    timeout: 60000,
  })
  if (
    !data ||
    typeof data.description !== 'string' ||
    typeof data.mission !== 'string' ||
    typeof data.live !== 'boolean' ||
    !Number.isInteger(data.remainingToday)
  )
    throw new Error('AI 초안 응답을 확인할 수 없습니다.')
  return data
}
