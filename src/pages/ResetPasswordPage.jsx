/**
 * 비밀번호 재설정 화면입니다(/password/reset?token=).
 * - 링크의 토큰을 먼저 서버에서 확인하고, 쓸 수 없으면(만료·사용됨) 다시 받기 안내를 보여줍니다.
 * - 새 비밀번호 규칙(영문+숫자, 8~100자)과 확인 입력 일치를 먼저 확인한 뒤 저장합니다.
 * - 저장되면 기존 로그인 정보를 지우고 로그인 화면으로 안내합니다. 안내와 오류는 화면 안에 표시합니다(팝업 없이).
 * - 비밀번호 칸은 눈 아이콘으로 입력한 글자를 보거나 숨길 수 있습니다(PasswordField).
 * 변경 이력: 입력 폼 안 요소 사이 간격이 없음 → 로그인 카드와 같은 간격(common-auth-card), 오류는 빨간 느낌표 안내.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword, validatePasswordResetToken } from '../api/authApi'
import CommonLayout from '../components/layout/CommonLayout'
import FormAlert from '../components/ui/FormAlert'
import PasswordField from '../components/ui/PasswordField'
import { newPasswordError } from '../features/auth/passwordRules'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [validation, setValidation] = useState({ token: '', valid: false })
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  useEffect(() => {
    if (!token) return
    validatePasswordResetToken(token)
      .then((result) => setValidation({ token, valid: Boolean(result.valid) }))
      .catch(() => setValidation({ token, valid: false }))
  }, [token])

  const submit = async (event) => {
    event.preventDefault()
    const problem = newPasswordError(form.newPassword, form.confirmPassword)
    if (problem) {
      setError(problem)
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await resetPassword(token, form.newPassword)
      // 다른 로그인 상태가 남지 않도록 저장된 로그인 정보를 지웁니다.
      sessionStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setDone(
        result.message ||
          '비밀번호를 바꿨습니다. 새 비밀번호로 로그인해 주세요.',
      )
    } catch (failure) {
      setError(
        failure.response?.data?.detail ||
          '만료되었거나 사용할 수 없는 재설정 링크입니다. 다시 요청해 주세요.',
      )
    } finally {
      setLoading(false)
    }
  }

  const checking = token && validation.token !== token
  const invalid = !token || (!checking && !validation.valid)

  return (
    <CommonLayout
      title="비밀번호 재설정"
      className="common-auth-page"
      hideTitle
    >
      <div className="common-card common-auth-card">
        {checking ? (
          <p className="common-auth-card__status" role="status">
            재설정 링크를 확인하고 있습니다.
          </p>
        ) : done ? (
          <>
            <h2>비밀번호를 바꿨습니다</h2>
            <p className="common-auth-card__status" role="status">
              {done}
            </p>
            <button
              className="common-button"
              type="button"
              onClick={() => navigate('/login', { replace: true })}
            >
              로그인하러 가기
            </button>
          </>
        ) : invalid ? (
          <>
            <h2>사용할 수 없는 링크입니다</h2>
            <p>
              링크가 만료되었거나 이미 사용되었습니다. 재설정 링크는 30분 동안
              한 번만 쓸 수 있습니다.
            </p>
            <button
              className="common-button"
              type="button"
              onClick={() => navigate('/password/forgot')}
            >
              재설정 링크 다시 받기
            </button>
            <button
              className="common-button common-button--secondary"
              type="button"
              onClick={() => navigate('/login')}
            >
              로그인으로 돌아가기
            </button>
          </>
        ) : (
          <form className="common-auth-card__form" onSubmit={submit}>
            <h2>새 비밀번호 설정</h2>
            <p id="reset-password-help">
              영문과 숫자를 포함해 8자 이상으로 입력해 주세요.
            </p>
            <PasswordField
              label="새 비밀번호"
              value={form.newPassword}
              onChange={(event) => {
                setForm({ ...form, newPassword: event.target.value })
                setError('')
              }}
              minLength={8}
              maxLength={100}
              required
              autoComplete="new-password"
              aria-describedby="reset-password-help"
              aria-invalid={Boolean(error) || undefined}
            />
            <PasswordField
              label="새 비밀번호 확인"
              value={form.confirmPassword}
              onChange={(event) => {
                setForm({ ...form, confirmPassword: event.target.value })
                setError('')
              }}
              minLength={8}
              maxLength={100}
              required
              autoComplete="new-password"
              aria-invalid={Boolean(error) || undefined}
            />
            <FormAlert>{error}</FormAlert>
            <button className="common-button" type="submit" disabled={loading}>
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        )}
      </div>
    </CommonLayout>
  )
}

export default ResetPasswordPage
