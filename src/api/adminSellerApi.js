/**
 * 전체/심사 대기 업체 조회와 개별 승인·반려 요청을 구분합니다.
 * 승인 결과를 화면에서 임의로 만들지 않고 서버 응답 본문을 호출한 페이지에 돌려줍니다.
 */
import api from './axios'

// 전체 심사 상태를 포함하는 목록입니다. 대기 건만 필요한 화면은 아래의 별도 조회를 사용합니다.
export const getAllSellers = async () => {
  const response = await api.get('/admin/sellers')
  return response.data
}

// 심사 대기 업체 목록입니다. 왼쪽 메뉴 배지처럼 화면을 떠나면 취소할 수 있도록 signal을 받습니다.
export const getPendingSellers = async (signal) => {
  const response = await api.get('/admin/sellers/pending', {
    signal,
    timeout: 15000,
  })
  return response.data
}

// 업체 한 건의 승인을 요청합니다. 회원의 일반 로그인 상태만으로 이 요청의 권한이 보장되지는 않습니다.
export const approveSeller = async (sellerId) => {
  const response = await api.patch(`/admin/sellers/${sellerId}/approve`)
  return response.data
}

// 동일 업체의 반려 명령을 별도 경로로 전송하며 응답 본문을 호출 화면에 돌려줍니다.
export const rejectSeller = async (sellerId) => {
  const response = await api.patch(`/admin/sellers/${sellerId}/reject`)
  return response.data
}
