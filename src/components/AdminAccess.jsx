/**
 * 직접 주소로 접근해도 서버가 확인한 운영자만 관리자 화면을 렌더링합니다.
 * 업체 승인 상태는 운영자 권한으로 취급하지 않으며 API의 서버 인가도 그대로 적용됩니다.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyInfo } from '../api/authApi'
import CommonLayout from './layout/CommonLayout'

export default function AdminAccess({ children }) {
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    getMyInfo()
      .then((member) => {
        if (active) setStatus(member.role === 'ADMIN' ? 'allowed' : 'denied')
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [attempt])
  if (status === 'allowed') return children
  return (
    <CommonLayout title="관리자 접근 확인">
      {status === 'loading' && <p role="status">권한을 확인하고 있습니다.</p>}
      {status === 'denied' && (
        <p role="alert">운영자만 이용할 수 있는 페이지입니다.</p>
      )}
      {status === 'error' && (
        <>
          <p role="alert">권한을 확인하지 못했습니다.</p>
          <button
            onClick={() => {
              setStatus('loading')
              setAttempt(attempt + 1)
            }}
          >
            다시 시도
          </button>
        </>
      )}
      <Link to="/home">홈으로 이동</Link>
    </CommonLayout>
  )
}
