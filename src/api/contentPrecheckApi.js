/**
 * 참여자 콘텐츠 제출 화면의 '제출 전 점검' 요청입니다.
 * AI 키는 서버만 가지고 있으며, 화면은 서버에 점검을 요청하고 답 형식만 확인합니다. 본문은 저장되지 않습니다.
 */
import api from './axios'
import { validPrecheck } from '../features/membership/contentPrecheckModel.js'

// AI가 읽는 동안 기다릴 수 있도록 일반 요청보다 길게 기다립니다.
export async function requestContentPrecheck(applicationId, request) {
  const { data } = await api.post(
    `/campaign-contents/ai/applications/${encodeURIComponent(applicationId)}/precheck`,
    request,
    { timeout: 60000 },
  )
  if (!validPrecheck(data))
    throw new Error('점검 결과를 확인할 수 없습니다. 다시 시도해 주세요.')
  return data
}
