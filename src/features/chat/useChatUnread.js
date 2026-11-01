/**
 * 안 읽은 채팅 메시지 수를 가져옵니다(헤더·업체 메뉴·운영자 메뉴 배지용).
 * - 30초마다, 화면으로 돌아왔을 때, 페이지를 옮겼을 때, 채팅을 읽었을 때 다시 가져옵니다.
 * - 로그인하지 않았거나 화면이 가려져 있으면 요청하지 않고, 실패하면 직전 값을 그대로 둡니다.
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CHATS_CHANGED, readChatUnreadCount } from '../../api/chatApi'

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
    const timer = setInterval(load, REFRESH_MS)
    window.addEventListener('focus', load)
    window.addEventListener(CHATS_CHANGED, load)
    document.addEventListener('visibilitychange', load)
    return () => {
      alive = false
      clearInterval(timer)
      window.removeEventListener('focus', load)
      window.removeEventListener(CHATS_CHANGED, load)
      document.removeEventListener('visibilitychange', load)
    }
  }, [pathname])
  return count
}
