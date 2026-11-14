/**
 * 소셜 콜백의 토큰을 전용 세션 처리 함수에 전달하고 완료 경로로 이동합니다.
 * 이전 계정의 갱신 토큰이 새 액세스 토큰과 함께 남지 않도록 세션 초기화를 위임합니다.
 */
import { useEffect } from 'react'
import { saveOAuthSession } from '../features/auth/oauthSession'
import { useNavigate, useSearchParams } from 'react-router-dom'

function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const token = searchParams.get('token')

  useEffect(() => {
    if (!saveOAuthSession(token, sessionStorage, localStorage)) {
      alert('간편 로그인에 실패했습니다. 다시 시도해 주세요.')
      navigate('/login', { replace: true })
      return
    }
    // 실시간 채팅 연결·헤더가 새 계정 기준으로 다시 맞추도록 알립니다.
    window.dispatchEvent(new Event('movrit:session-updated'))

    navigate('/mypage', {
      replace: true,
    })
  }, [token, navigate])

  return <div>로그인 처리 중...</div>
}

export default OAuthCallbackPage
