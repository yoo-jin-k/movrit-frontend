/**
 * 소셜 계정 연결 콜백의 성공 여부와 안내 문구를 보여준 뒤 마이페이지로 돌아갑니다.
 * 연결 결과를 안내할 뿐 로그인 토큰을 새로 발급하거나 저장하지 않습니다.
 */
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

function SocialLinkCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const provider = searchParams.get('provider')
    const success = searchParams.get('success') === 'true'
    const message = searchParams.get('message')

    if (success) {
      alert(`${provider} 계정 연결이 완료됐어.`)
    } else {
      alert(message || '소셜 계정 연결에 실패했어.')
    }

    navigate('/mypage', { replace: true })
  }, [navigate, searchParams])

  return <p>소셜 계정을 연결하고 있어...</p>
}

export default SocialLinkCallbackPage
