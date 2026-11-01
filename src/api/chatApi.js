/**
 * 브랜드·참여자·운영자 채팅 API입니다.
 * 볼 수 있는 방은 서버가 로그인 회원 기준으로 정하며, 화면은 몇 초마다 '마지막으로 받은 메시지 다음'을 다시 요청해 새 메시지를 받습니다.
 */
import api from './axios'

// 메시지를 읽으면 헤더·메뉴의 안 읽은 채팅 수가 바로 줄어들도록 화면 전체에 알립니다.
export const CHATS_CHANGED = 'movrit:chats-changed'
export const announceChatsChanged = () => {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new Event(CHATS_CHANGED))
}

export async function readChatRooms(signal) {
  const { data } = await api.get('/chats', { signal, timeout: 15000 })
  if (!Array.isArray(data)) throw new Error('채팅 목록을 확인할 수 없습니다.')
  return data
}

export async function readChatUnreadCount() {
  const { data } = await api.get('/chats/unread-count', { timeout: 15000 })
  return Number(data?.count) || 0
}

export async function openApplicationChat(applicationId) {
  const { data } = await api.post(
    `/chats/applications/${encodeURIComponent(applicationId)}`,
    undefined,
    { timeout: 15000 },
  )
  return data
}

export async function openSupportChat() {
  const { data } = await api.post('/chats/support', undefined, {
    timeout: 15000,
  })
  return data
}

// after가 있으면 그 다음 메시지만 받습니다(새 메시지 확인). 받은 곳까지 서버가 읽음 처리합니다.
export async function readChatMessages(roomId, after, signal) {
  const { data } = await api.get(
    `/chats/${encodeURIComponent(roomId)}/messages`,
    { params: after ? { after } : undefined, signal, timeout: 15000 },
  )
  return data
}

export async function sendChatMessage(roomId, body) {
  const { data } = await api.post(
    `/chats/${encodeURIComponent(roomId)}/messages`,
    { body },
    { timeout: 15000 },
  )
  return data
}
