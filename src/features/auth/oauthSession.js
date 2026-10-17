// 소셜 콜백 계약은 access token만 전달합니다.
export function saveOAuthSession(token, session, local) {
  if (typeof token !== 'string' || !token.trim()) return false
  local.removeItem('refreshToken')
  session.setItem('accessToken', token)
  return true
}
