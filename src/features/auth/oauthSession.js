/**
 * 소셜 로그인으로 받은 액세스 토큰을 이 탭에 저장합니다.
 * 소셜 콜백 계약은 access token만 전달하므로, 남아 있는 예전 갱신 토큰(공용 키·같은 계정 키)으로 되돌아가지 않게 지웁니다.
 * 다른 계정 탭의 갱신 토큰은 그대로 둡니다. 문자열이 아니거나 공백뿐인 값은 저장하지 않습니다.
 * 토큰의 서명·유효성 검증은 서버가 담당합니다.
 */
import { refreshKey, tokenMemberId } from './sessionTokenModel.js'

export function saveOAuthSession(token, session, local) {
  if (typeof token !== 'string' || !token.trim()) return false
  local.removeItem('refreshToken')
  const id = tokenMemberId(token)
  if (id) local.removeItem(refreshKey(id))
  session.setItem('accessToken', token)
  return true
}
