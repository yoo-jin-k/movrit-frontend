/** 서버 로그아웃 결과와 브라우저 세션 종료를 구분해 안내합니다. */
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../api/authApi'
import { clearSession } from './sessionTokenModel'
export default function LogoutButton({ className = '' }) {
  const navigate = useNavigate()
  const inFlight = useRef(false)
  const [busy, setBusy] = useState(false)
  const signout = async () => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    let notice = '이 브라우저에서 로그아웃했습니다.'
    try {
      await logout()
    } catch {
      notice =
        '이 브라우저의 로그인 정보는 삭제했습니다. 서버 로그아웃은 확인하지 못했습니다.'
    } finally {
      clearSession(sessionStorage, localStorage)
      window.dispatchEvent(new Event('movrit:session-updated'))
      navigate('/login', { replace: true, state: { sessionNotice: notice } })
    }
  }
  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={signout}
    >
      {busy ? '로그아웃 중…' : '로그아웃'}
    </button>
  )
}
