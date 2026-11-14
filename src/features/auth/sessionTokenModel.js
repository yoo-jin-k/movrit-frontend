/**
 * 탭마다 다른 계정으로 로그인해도 서로 섞이지 않게 로그인 토큰을 보관하는 규칙입니다.
 * - 접근 토큰은 탭(sessionStorage)마다 따로 둡니다.
 * - 갱신 토큰은 브라우저 공용 저장소(localStorage)에 "계정별 키"로 둡니다(refreshToken:<회원 번호>).
 *   같은 계정의 탭들은 갱신 때마다 바뀌는 최신 토큰을 함께 쓰고, 다른 계정 탭은 자기 계정 토큰만 씁니다.
 * - 예전 방식의 공용 키(refreshToken)는 주인을 알 수 없으므로, 그 토큰으로 갱신한 결과가 이 탭 계정과 다르면 적용하지 않습니다.
 * 서버 API는 사용하지 않으며, 토큰 서명 검증은 서버가 담당합니다(여기서는 화면 판단용으로 회원 번호만 읽습니다).
 */

const ACCESS_KEY = 'accessToken'
// 예전 방식의 공용 갱신 토큰 키입니다. 새로 저장하지 않고 정리만 합니다.
const LEGACY_REFRESH_KEY = 'refreshToken'

export const refreshKey = (memberId) => `refreshToken:${memberId}`

// 다른 계정 토큰으로 갱신될 뻔해 로그인 화면으로 보낼 때 붙이는 주소 값과 안내입니다.
export const ACCOUNT_SWITCHED_REASON = 'account-switched'
export const ACCOUNT_SWITCHED_NOTICE =
  '이 탭의 로그인 정보를 확인할 수 없어 다시 로그인이 필요합니다.'

// 접근 토큰(JWT)의 subject(회원 번호)를 읽습니다. 형식이 다르면 null입니다.
export function tokenMemberId(token) {
  if (typeof token !== 'string') return null
  const payload = token.split('.')[1]
  if (!payload) return null
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const sub = JSON.parse(atob(padded))?.sub
    return sub === undefined || sub === null || sub === '' ? null : String(sub)
  } catch {
    return null
  }
}

// 로그인 직후 이 탭의 접근 토큰과 그 계정의 갱신 토큰을 저장합니다.
export function saveLogin(accessToken, refreshToken, session, local) {
  session.setItem(ACCESS_KEY, accessToken)
  local.removeItem(LEGACY_REFRESH_KEY)
  const id = tokenMemberId(accessToken)
  if (id && refreshToken) local.setItem(refreshKey(id), refreshToken)
}

// 이 탭 계정의 갱신 토큰입니다. 계정별 키가 없으면 예전 공용 키를 씁니다(갱신 결과는 storeRefreshed가 다시 확인).
export function readRefreshToken(session, local) {
  const id = tokenMemberId(session.getItem(ACCESS_KEY))
  const own = id ? local.getItem(refreshKey(id)) : null
  return own || local.getItem(LEGACY_REFRESH_KEY)
}

/**
 * 갱신 응답을 저장합니다. 새 갱신 토큰은 그 토큰 주인의 계정 키에 둡니다(같은 계정 다른 탭이 이어서 쓰도록).
 * 받은 계정이 이 탭 계정과 다르면 이 탭에는 적용하지 않고 false를 돌려줍니다.
 */
export function storeRefreshed(tabMemberId, data, session, local) {
  const newId = tokenMemberId(data?.accessToken)
  if (newId && data?.refreshToken)
    local.setItem(refreshKey(newId), data.refreshToken)
  local.removeItem(LEGACY_REFRESH_KEY)
  if (tabMemberId && newId && String(tabMemberId) !== newId) return false
  session.setItem(ACCESS_KEY, data.accessToken)
  return true
}

// 로그아웃·비밀번호 변경 등으로 이 탭 계정의 세션을 지웁니다. 다른 계정 탭의 토큰은 남겨 둡니다.
export function clearSession(session, local) {
  const id = tokenMemberId(session.getItem(ACCESS_KEY))
  if (id) local.removeItem(refreshKey(id))
  local.removeItem(LEGACY_REFRESH_KEY)
  session.removeItem(ACCESS_KEY)
}
