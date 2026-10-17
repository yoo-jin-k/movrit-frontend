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

    navigate('/mypage', {
      replace: true,
    })
  }, [token, navigate])

  return <div>로그인 처리 중...</div>
}

export default OAuthCallbackPage
