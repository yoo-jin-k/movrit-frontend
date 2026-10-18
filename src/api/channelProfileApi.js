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
// 저장 응답도 조회와 동일한 검증을 거칩니다. 상태를 낙관적으로 검증 완료로 바꾸지 않습니다.
export async function saveChannelMetric(request) {
  const { data } = await api.put(endpoint, request, { timeout: 15000 })
  return validateChannelProfile(data)
}
