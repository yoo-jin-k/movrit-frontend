/**
 * 인증이 필요한 API의 기본 주소와 요청/응답 인터셉터를 설정합니다.
 * 요청 시 세션의 액세스 토큰을 붙이고, 401이면 저장된 갱신 토큰으로 원래 요청을 한 번 재전송합니다.
 * 갱신 실패 또는 최종 401은 인증 정보를 정리하고 로그인 화면으로 안내합니다.
 */
import axios from 'axios'

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

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config
    const refreshToken = localStorage.getItem('refreshToken')
    if (
      error.response?.status === 401 &&
      refreshToken &&
      !original?._retry &&
      !original?.url?.includes('/auth/refresh')
    ) {
      // 같은 요청의 갱신 시도를 표시하여 401이 반복될 때 무한 재귀를 막습니다.
      // 이 재시도는 인증 복구용이며 업무 버전 충돌(409)을 자동 재시도하는 기능은 아닙니다.
      original._retry = true
      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken })
        sessionStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        localStorage.removeItem('refreshToken')
      }
    }
    if (error.response?.status === 401) {
      sessionStorage.removeItem('accessToken')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
