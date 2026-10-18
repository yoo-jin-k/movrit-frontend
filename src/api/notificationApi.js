/**
 * 알림 목록·미확인 건수와 개별/전체 읽음 처리를 요청합니다.
 * 읽음 표시와 화면 이동은 호출한 페이지가 서버 처리 결과에 맞춰 수행합니다.
 */
import api from './axios'

export const getNotifications = async () => {
  const response = await api.get('/notifications')
  return response.data
}

export const getUnreadNotificationCount = async () => {
  const response = await api.get('/notifications/unread-count')
  return response.data
}

export const markNotificationRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`)
  return response.data
}

// 응답 본문을 쓰지 않는 명령입니다. 완료 후 화면의 목록·건수 갱신은 호출부에서 수행합니다.
export const markAllNotificationsRead = async () => {
  await api.patch('/notifications/read-all')
}
