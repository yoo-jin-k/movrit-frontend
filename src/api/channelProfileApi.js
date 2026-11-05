/**
 * 본인의 채널 지표 조회와 수정 요청을 처리합니다.
 * 응답은 채널 프로필 검증을 거치며, 화면이 확인되지 않은 값을 인증된 지표로 오해하지 않도록 합니다.
 */
import api from './axios'
import { validateChannelProfile } from '../features/membership/channelProfileModel'
const endpoint = '/users/me/channel-profile'
export async function readChannelProfile(signal) {
  const { data } = await api.get(endpoint, { signal, timeout: 15000 })
  return validateChannelProfile(data)
}
// 연결한 네이버 블로그의 방문자 수를 서버가 지금 읽어 최근 4일 평균을 기록합니다. 방문자 조건이 있는 캠페인 신청 화면에서만 부릅니다.
export async function checkNaverBlogVisitors() {
  const { data } = await api.post(`${endpoint}/naver-blog-visitors`, null, {
    timeout: 20000,
  })
  if (
    !data ||
    !Number.isSafeInteger(data.averageVisitors) ||
    !Number.isSafeInteger(data.days) ||
    !Array.isArray(data.dailyVisitors)
  )
    throw new Error('방문자 수 확인 응답을 확인할 수 없습니다.')
  return data
}
// 저장 응답도 조회와 동일한 검증을 거칩니다. 상태를 낙관적으로 검증 완료로 바꾸지 않습니다.
export async function saveChannelMetric(request) {
  const { data } = await api.put(endpoint, request, { timeout: 15000 })
  return validateChannelProfile(data)
}
