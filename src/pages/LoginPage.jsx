/**
 * 이메일 로그인과 소셜 로그인 시작을 처리합니다.
 * 이메일 로그인 성공 후 토큰을 저장하고 안전한 내부 복귀 경로를 선택하며 상태 코드별 실패 문구를 표시합니다.
 * 성공 시 브라우저 기본 알림창을 띄우지 않고 바로 이동해 화면 흐름이 끊기지 않도록 합니다.
 * 이메일·비밀번호가 맞지 않으면(401) 빨간 느낌표 안내를 보여 주고 두 입력칸을 오류로 강조합니다(aria-invalid).
 * 변경 이력: 오류 문구가 회색 본문 글자와 같아 눈에 띄지 않음 → 빨간 글자·느낌표 아이콘·입력칸 테두리 강조.
 */
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login, getKakaoLoginUrl, getGoogleLoginUrl } from '../api/authApi'
import CommonLayout from '../components/layout/CommonLayout'
import FormAlert from '../components/ui/FormAlert'
import PasswordField from '../components/ui/PasswordField'
import { isCredentialError, loginError } from '../features/auth/loginError'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // 서버가 소셜 로그인 실패 시 /login?socialError=KAKAO|GOOGLE|GOOGLE_EMAIL_EXISTS 로 돌려보냅니다. 상세 오류 대신 안내 문구만 보여줍니다.
  const socialError = new URLSearchParams(location.search).get('socialError')
  const [errorMessage, setErrorMessage] = useState(() =>
    socialError === 'KAKAO'
      ? '카카오 로그인을 완료하지 못했습니다. 잠시 후 다시 시도하거나 이메일로 로그인해 주세요.'
      : socialError === 'GOOGLE'
        ? 'Google 로그인을 완료하지 못했습니다. 잠시 후 다시 시도하거나 이메일로 로그인해 주세요.'
        : socialError === 'GOOGLE_EMAIL_EXISTS'
          ? '이미 가입된 이메일입니다. 기존 방법으로 로그인한 뒤 설정 > 로그인 연결에서 Google을 연결해 주세요.'
          : '',
  )
  const [busy, setBusy] = useState(false)
  // 이메일·비밀번호가 맞지 않았을 때만 입력칸을 오류로 표시합니다. 다시 입력하기 시작하면 강조를 지웁니다.
  const [credentialInvalid, setCredentialInvalid] = useState(false)
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
    if (credentialInvalid) {
      setCredentialInvalid(false)
      setErrorMessage('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setErrorMessage('')
    setCredentialInvalid(false)
    try {
      const result = await login(form)
      sessionStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('refreshToken', result.refreshToken)
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
      setCredentialInvalid(isCredentialError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <CommonLayout title="로그인" className="common-auth-page" hideTitle>
      <form className="common-card common-auth-card" onSubmit={handleSubmit}>
        <h2>MOVRIT에 로그인</h2>
        {location.state?.sessionNotice && (
          <p role="status">{location.state.sessionNotice}</p>
        )}
        <p>캠페인 신청부터 콘텐츠 제출까지 한 곳에서 관리하세요.</p>
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
            aria-invalid={credentialInvalid || undefined}
            aria-describedby={errorMessage ? 'login-error' : undefined}
          />
        </label>
        <PasswordField
          label="비밀번호"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
          aria-invalid={credentialInvalid || undefined}
          aria-describedby={errorMessage ? 'login-error' : undefined}
        />
        <FormAlert id="login-error">{errorMessage}</FormAlert>
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
        {/* 소셜 로그인은 서비스별 색 구분을 유지해 이메일 로그인과 구별합니다. */}
        <div className="common-auth-card__divider">또는</div>
        <button
          className="common-button common-auth-card__social"
          type="button"
          onClick={handleGoogleLogin}
        >
          Google로 계속
        </button>
        <button
          className="common-button common-auth-card__social common-auth-card__social--kakao"
          type="button"
          onClick={handleKakaoLogin}
        >
          카카오로 계속
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
