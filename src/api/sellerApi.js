/**
 * 회원의 업체 신청·심사 상태와 업체 대시보드를 조회합니다.
 * 업체 신청의 회원 식별은 인증 토큰을 기준으로 서버가 수행합니다.
 */
import api from './axios'

// 로그인한 회원의 판매자 등록 신청을 서버에 전달합니다.
// memberId는 JWT에서 서버가 직접 확인하므로 프론트에서 보내지 않습니다.
export const applySeller = async (data) => {
  const response = await api.post('/sellers/apply', data)
  return response.data
}

// 현재 로그인한 회원의 판매자 등록/심사 상태를 조회합니다.
export const getMySellerProfile = async () => {
  const response = await api.get('/sellers/me')
  return response.data
}

export const getSellerDashboard = async () =>
  (await api.get('/sellers/dashboard')).data
