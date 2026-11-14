/**
 * 안 읽은 채팅 메시지 수를 가져옵니다(헤더·업체 메뉴·운영자 메뉴 배지용).
 * - 실시간 이벤트(새 메시지)를 받을 때, 30초마다, 화면으로 돌아왔을 때, 페이지를 옮겼을 때, 채팅을 읽었을 때 다시 가져옵니다.
 * - 로그인 상태면 실시간 이벤트 연결(chatStream)을 함께 열어 둡니다.
 * - 로그인하지 않았거나 화면이 가려져 있으면 요청하지 않고, 실패하면 직전 값을 그대로 둡니다.
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CHATS_CHANGED, readChatUnreadCount } from '../../api/chatApi'
import { NOTIFICATIONS_CHANGED } from '../../api/notificationApi'
import { CHAT_EVENT, acquireChatStream } from './chatStream'

const REFRESH_MS = 30000

export default function useChatUnread() {
  const { pathname } = useLocation()
  const [count, setCount] = useState(0)
  useEffect(() => {
    let alive = true
    const load = async () => {
      if (!sessionStorage.getItem('accessToken')) {
        if (alive) setCount(0)
        return
      }
      if (document.visibilityState === 'hidden') return
      try {
        const value = await readChatUnreadCount()
        if (alive) setCount(value)
      } catch {
        // 일시적인 실패는 다음 갱신 때 다시 시도합니다.
      }
    }
    load()
    const release = sessionStorage.getItem('accessToken')
      ? acquireChatStream()
      : () => {}
    // 새 메시지가 오면 채팅 배지와 알림 배지(새 메시지 알림)를 함께 갱신합니다.
    // 읽음 이벤트(같은 계정의 다른 창에서 읽은 경우 포함)는 채팅 배지만 다시 셉니다.
    const onEvent = (event) => {
      const type = event.detail?.type
      if (type === 'read') {
        load()
        return
      }
      if (type !== 'message') return
      load()
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
    }
    window.addEventListener(CHAT_EVENT, onEvent)
    const timer = setInterval(load, REFRESH_MS)
    window.addEventListener('focus', load)
    window.addEventListener(CHATS_CHANGED, load)
    document.addEventListener('visibilitychange', load)
    return () => {
      alive = false
      release()
      window.removeEventListener(CHAT_EVENT, onEvent)
      clearInterval(timer)
      window.removeEventListener('focus', load)
      window.removeEventListener(CHATS_CHANGED, load)
      document.removeEventListener('visibilitychange', load)
    }
  }, [pathname])
  return count
}
