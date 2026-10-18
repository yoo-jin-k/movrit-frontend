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

export const markAllNotificationsRead = async () => {
  await api.patch('/notifications/read-all')
}
