/**
 * 이메일 로그인과 소셜 로그인 시작을 처리합니다.
 * 이메일 로그인 성공 후 토큰을 저장하고 안전한 내부 복귀 경로를 선택하며 상태 코드별 실패 문구를 표시합니다.
 */
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login, getKakaoLoginUrl, getGoogleLoginUrl } from '../api/authApi'
import CommonLayout from '../components/layout/CommonLayout'
import { loginError } from '../features/auth/loginError'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [errorMessage, setErrorMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleKakaoLogin = async () => {
    try {
      const url = await getKakaoLoginUrl()
      window.location.href = url
    } catch {
      setErrorMessage('카카오 로그인을 시작하지 못했습니다.')
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const url = await getGoogleLoginUrl()
      window.location.href = url
    } catch {
      setErrorMessage('구글 로그인을 시작하지 못했습니다.')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setErrorMessage('')
    try {
      const result = await login(form)
      sessionStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('refreshToken', result.refreshToken)
      alert(`${result.name}님 로그인 성공!`)
      // 로그인 후에는 요청했던 캠페인 상세로 돌아가도록 합니다.
      const destination = location.state?.returnTo
      navigate(
        /^\/campaign\/\d+$/.test(destination || '') ||
          ['/home', '/seller/apply'].includes(destination)
          ? destination
          : '/mypage',
      )
    } catch (error) {
      setErrorMessage(loginError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <CommonLayout title="로그인" className="common-auth-page">
      <form className="common-card common-auth-card" onSubmit={handleSubmit}>
        <h2>MOVRIT에 로그인</h2>
        {location.state?.sessionNotice && (
          <p role="status">{location.state.sessionNotice}</p>
        )}
        <p>프리오더와 협업을 한 곳에서 관리하세요.</p>
        <label className="common-field">
          이메일
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            placeholder="name@example.com"
          />
        </label>
        <label className="common-field">
          비밀번호
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
        </label>
        <p role="alert">{errorMessage}</p>
        <button className="common-button" type="submit" disabled={busy}>
          {busy ? '로그인 중입니다…' : '로그인'}
        </button>
        <button
          className="common-auth-card__forgot"
          type="button"
          onClick={() => navigate('/password/forgot')}
        >
          비밀번호를 잊으셨나요?
        </button>
        <hr />
        <button
          className="common-button"
          type="button"
          onClick={handleGoogleLogin}
        >
          Google로 계속
        </button>
        <button
          className="common-button"
          type="button"
          onClick={handleKakaoLogin}
        >
          Kakao로 계속
        </button>
        <button
          className="common-auth-card__signup"
          type="button"
          onClick={() => navigate('/signup')}
        >
          회원가입
        </button>
      </form>
    </CommonLayout>
  )
}

export default LoginPage
