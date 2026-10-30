/**
 * 소셜 계정 연결 콜백입니다. 서버가 전달한 연결 결과를 설정 화면의 '로그인 연결' 영역으로 넘겨 안내합니다.
 * 브라우저 알림창 대신 화면 안 문구로 결과를 보여주며, 로그인 토큰을 새로 발급하거나 저장하지 않습니다.
 */
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { linkResultNotice } from '../features/membership/socialLinkModel'

function SocialLinkCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const linkNotice = linkResultNotice({
      provider: searchParams.get('provider'),
      success: searchParams.get('success') === 'true',
      message: searchParams.get('message'),
    })
    navigate('/settings#social-login', { replace: true, state: { linkNotice } })
  }, [navigate, searchParams])

  return <p role="status">소셜 계정 연결 결과를 확인하고 있습니다.</p>
}

export default SocialLinkCallbackPage
