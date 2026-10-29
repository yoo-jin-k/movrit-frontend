/**
 * 이메일 로그인·로그아웃·비밀번호 재설정과 소셜 로그인/계정 연결 URL을 요청합니다.
 * 토큰 저장과 화면 이동은 호출한 페이지가 처리하며, 이 모듈은 요청과 응답 전달을 담당합니다.
 */
import api from './axios'

export const login = async (data) => {
  const response = await api.post('/auth/login', data)
  return response.data
}

// 갱신 토큰이 있는 경우에만 서버에 로그아웃을 알립니다. 브라우저 저장소 삭제는 호출 화면이 담당합니다.
export const logout = async () => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (refreshToken)
    await api.post(
      '/auth/logout',
      { refreshToken },
      { timeout: 10000, skipAuthRefresh: true },
    )
}

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/password/forgot', { email })
  return response.data
}

// 링크의 재설정 토큰 유효성을 읽기 요청으로 확인합니다. 이 확인만으로 비밀번호가 변경되지는 않습니다.
export const validatePasswordResetToken = async (token) => {
  const response = await api.get('/auth/password/reset/validate', {
    params: { token },
  })
  return response.data
}

// 토큰과 새 비밀번호를 함께 전송합니다. 확인 입력 일치 여부와 완료 후 세션 정리는 페이지에서 처리합니다.
export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/auth/password/reset', {
    token,
    newPassword,
  })
  return response.data
}

export const getMyInfo = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

// 서버가 구성한 소셜 로그인 시작 URL을 사용합니다. 프론트에서 공급자 인증 파라미터를 임의 조립하지 않습니다.
export const getKakaoLoginUrl = async () => {
  const response = await api.get('/auth/kakao')
  return response.data
}

export const getGoogleLoginUrl = async () => {
  const response = await api.get('/auth/google/login-url')
  return response.data
}

// 현재 계정에 연결된 소셜 계정과 연결 시작 URL을 위한 기존 인증 경로입니다.
export const getSocialAccounts = async () => {
  const response = await api.get('/auth/social/accounts')
  return response.data
}

export const getKakaoLinkUrl = async () => {
  const response = await api.get('/auth/social/kakao/link-url')
  return response.data
}

export const getGoogleLinkUrl = async () => {
  const response = await api.get('/auth/social/google/link-url')
  return response.data
}
