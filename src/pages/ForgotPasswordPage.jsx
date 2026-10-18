/**
 * 입력한 이메일로 비밀번호 재설정을 요청하고 서버 안내를 보여줍니다.
 * 응답에 포함된 개발용 토큰을 별도 상태로 보관하므로 실제 이메일 전달 성공을 화면만으로 판정하지 않습니다.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { forgotPassword } from '../api/authApi'
import CommonLayout from '../components/layout/CommonLayout'

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [devToken, setDevToken] = useState(null)

  // 메일 요청 중 상태로 중복 입력을 제한하고 서버가 제공한 안내와 개발용 토큰을 별도로 보관합니다.
  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setDevToken(null)

    try {
      const result = await forgotPassword(email)
      setMessage(result.message)
      setDevToken(result.devResetToken || null)
    } catch (error) {
      console.error(error)
      setMessage(
        '비밀번호 재설정 요청을 처리하지 못했어. 잠시 후 다시 시도해줘.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <CommonLayout title="계정 찾기">
      <form className="common-card common-account-card" onSubmit={submit}>
        <h2>계정 찾기</h2>
        <p>가입한 이메일로 인증해.</p>
        <label className="common-field">
          이메일
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <button className="common-button" type="submit" disabled={loading}>
          {loading ? '요청 중...' : '재설정 메일 받기'}
        </button>
        {message && <p>{message}</p>}

        {devToken && (
          <div>
            <p>로컬 개발 모드라 재설정 링크를 바로 테스트할 수 있어.</p>
            <button
              className="common-button"
              onClick={() =>
                navigate(
                  `/password/reset?token=${encodeURIComponent(devToken)}`,
                )
              }
            >
              비밀번호 재설정 테스트
            </button>
          </div>
        )}

        <button
          className="common-button common-button--secondary"
          type="button"
          onClick={() => navigate('/login')}
        >
          로그인으로 돌아가기
        </button>
      </form>
    </CommonLayout>
  )
}

export default ForgotPasswordPage
