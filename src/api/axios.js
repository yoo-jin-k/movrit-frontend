/**
 * 인증이 필요한 API의 기본 주소와 요청/응답 인터셉터를 설정합니다.
 * 요청 시 세션의 액세스 토큰을 붙이고, 401이면 저장된 갱신 토큰으로 원래 요청을 한 번 재전송합니다.
 * 갱신 실패 또는 최종 401은 인증 정보를 정리하고 로그인 화면으로 안내합니다.
 * 갱신 토큰은 계정별로 보관하므로 탭마다 다른 계정으로 로그인해도 각 탭은 자기 계정으로만 갱신합니다(sessionTokenModel).
 */
import axios from 'axios'
import {
  ACCOUNT_SWITCHED_REASON,
  clearSession,
  readRefreshToken,
  storeRefreshed,
  tokenMemberId,
} from '../features/auth/sessionTokenModel'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// 매 요청 시점의 토큰을 읽으므로 로그인·로그아웃 이후의 세션 변경을 다음 요청에 반영합니다.
api.interceptors.request.use((config) => {
  const accessToken = sessionStorage.getItem('accessToken')

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

export default api

// 접근 토큰이 만료된 순간 여러 요청이 동시에 401을 받아도 갱신은 한 번만 합니다.
// 갱신 토큰은 쓸 때마다 새 값으로 바뀌므로, 같은 토큰으로 두 번 갱신하면 두 번째가 실패해 로그아웃되기 때문입니다.
let pendingRefresh = null
function refreshOnce(refreshToken) {
  if (!pendingRefresh) {
    pendingRefresh = axios
      .post('/api/auth/refresh', { refreshToken })
      .then(({ data }) => {
        // 로그아웃 이후 도착한 갱신 응답으로 세션이 복구되지 않게 합니다.
        if (readRefreshToken(sessionStorage, localStorage) !== refreshToken)
          return null
        // 받은 계정이 이 탭 계정과 다르면(예전 공용 키의 주인이 다른 계정) 이 탭에 적용하지 않고 다시 로그인하게 합니다.
        const tabMemberId = tokenMemberId(sessionStorage.getItem('accessToken'))
        if (!storeRefreshed(tabMemberId, data, sessionStorage, localStorage)) {
          sessionStorage.removeItem('accessToken')
          if (window.location.pathname !== '/login')
            window.location.href = `/login?reason=${ACCOUNT_SWITCHED_REASON}`
          return null
        }
        return data.accessToken
      })
      .finally(() => {
        pendingRefresh = null
      })
  }
  return pendingRefresh
}

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config
    const refreshToken = readRefreshToken(sessionStorage, localStorage)
    if (
      error.response?.status === 401 &&
      refreshToken &&
      !original?.skipAuthRefresh &&
      !original?._retry &&
      !original?.url?.includes('/auth/refresh')
    ) {
      // 같은 요청의 갱신 시도를 표시하여 401이 반복될 때 무한 재귀를 막습니다.
      // 이 재시도는 인증 복구용이며 업무 버전 충돌(409)을 자동 재시도하는 기능은 아닙니다.
      original._retry = true
      try {
        // 다른 요청이 이미 새 토큰을 받아 왔다면 갱신하지 않고 그 토큰으로 다시 보냅니다.
        const current = sessionStorage.getItem('accessToken')
        const sent = String(original.headers?.Authorization || '')
        const accessToken =
          current && sent && sent !== `Bearer ${current}`
            ? current
            : await refreshOnce(refreshToken)
        if (!accessToken) return Promise.reject(error)
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        // 갱신에 실패한 이 탭 계정의 세션만 지웁니다(다른 계정 탭은 그대로 둡니다).
        clearSession(sessionStorage, localStorage)
      }
    }
    if (error.response?.status === 401 && !original?.skipAuthRefresh) {
      sessionStorage.removeItem('accessToken')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
