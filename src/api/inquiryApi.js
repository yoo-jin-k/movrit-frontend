/**
 * 본인 문의 등록·조회·종료와 운영자 목록·답변 요청을 구분합니다.
 * 운영자 상태 필터는 값이 있을 때만 쿼리로 보내며 최종 접근 권한은 서버가 확인합니다.
 */
import api from './axios'

export const createInquiry = async (data) => {
  const response = await api.post('/inquiries', data)
  return response.data
}

export const getMyInquiries = async () => {
  const response = await api.get('/inquiries/mine')
  return response.data
}

export const closeInquiry = async (id) => {
  const response = await api.patch(`/inquiries/${id}/close`)
  return response.data
}

// 상태가 없으면 필터 없는 목록을 요청합니다. 빈 문자열을 유효한 상태값으로 전송하지 않습니다.
export const getAdminInquiries = async (status) => {
  const response = await api.get('/inquiries/admin', {
    params: status ? { status } : {},
  })
  return response.data
}

// 문의 ID와 답변 본문을 묶어 전송합니다. 답변의 빈 값 검사는 입력 화면에서 먼저 수행합니다.
export const answerInquiry = async (id, answer) => {
  const response = await api.patch(`/inquiries/admin/${id}/answer`, { answer })
  return response.data
}
