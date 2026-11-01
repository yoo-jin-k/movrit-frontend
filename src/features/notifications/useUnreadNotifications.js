/**
 * 로그인한 회원의 읽지 않은 알림 개수를 가져와 헤더 종 아이콘과 하단 탭에 표시합니다.
 * - 30초마다, 화면으로 돌아왔을 때, 페이지를 옮겼을 때, 알림을 읽었을 때 다시 가져옵니다.
 * - 화면이 가려져 있으면 요청하지 않고, 실패하면 직전 개수를 그대로 둡니다(오류를 화면에 띄우지 않습니다).
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  getUnreadNotificationCount,
  NOTIFICATIONS_CHANGED,
} from '../../api/notificationApi'

const REFRESH_MS = 30000

export default function useUnreadNotifications() {
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
        const data = await getUnreadNotificationCount()
        if (alive) setCount(Number(data?.count) || 0)
      } catch {
        // 일시적인 실패는 무시하고 다음 갱신 때 다시 시도합니다.
      }
    }
    load()
    const timer = setInterval(load, REFRESH_MS)
    window.addEventListener('focus', load)
    window.addEventListener(NOTIFICATIONS_CHANGED, load)
    document.addEventListener('visibilitychange', load)
    return () => {
      alive = false
      clearInterval(timer)
      window.removeEventListener('focus', load)
      window.removeEventListener(NOTIFICATIONS_CHANGED, load)
      document.removeEventListener('visibilitychange', load)
    }
  }, [pathname])

  return count
}
