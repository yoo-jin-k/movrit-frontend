/**
 * 소셜 로그인으로 받은 액세스 토큰을 저장하기 전에 이전 갱신 토큰을 제거합니다.
 * 문자열이 아니거나 공백뿐인 값은 저장하지 않습니다. 토큰의 서명·유효성 검증은 서버가 담당합니다.
 */
// 소셜 콜백 계약은 access token만 전달합니다.
export function saveOAuthSession(token, session, local) {
  if (typeof token !== 'string' || !token.trim()) return false
  local.removeItem('refreshToken')
  session.setItem('accessToken', token)
  return true
}
