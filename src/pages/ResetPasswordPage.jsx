/**
 * URL의 재설정 토큰을 먼저 확인하고 새 비밀번호와 확인 입력을 검증합니다.
 * 변경 성공 후 기존 토큰을 지우며 실패 시 현재 링크를 유효한 것으로 유지하지 않습니다.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword, validatePasswordResetToken } from '../api/authApi'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [validation, setValidation] = useState({ token: '', valid: false })
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    validatePasswordResetToken(token)
      .then((result) => setValidation({ token, valid: result.valid }))
      .catch(() => setValidation({ token, valid: false }))
  }, [token])

  // 새 비밀번호의 길이와 일치 여부를 먼저 확인하고 성공 시 기존 로그인 세션을 정리합니다.
  const submit = async (e) => {
    e.preventDefault()
    if (form.newPassword.length < 8) {
      alert('비밀번호는 8자 이상으로 입력해줘.')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      alert('비밀번호 확인이 일치하지 않아.')
      return
    }

    setLoading(true)
    try {
      const result = await resetPassword(token, form.newPassword)
      sessionStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      alert(result.message)
      navigate('/login', { replace: true })
    } catch (error) {
      console.error(error)
      alert(
        error.response?.data?.message ||
          '만료되었거나 사용할 수 없는 재설정 링크야.',
      )
      setValidation({ token, valid: false })
    } finally {
      setLoading(false)
    }
  }

  if (token && validation.token !== token)
    return <p>재설정 링크를 확인하는 중...</p>

  if (!token || !validation.valid) {
    return (
      <div>
        <h1>비밀번호 재설정</h1>
        <p>만료되었거나 유효하지 않은 링크야.</p>
        <button onClick={() => navigate('/password/forgot')}>
          재설정 링크 다시 받기
        </button>
        <button onClick={() => navigate('/login')}>로그인으로 돌아가기</button>
      </div>
    )
  }

  return (
    <div>
      <h1>새 비밀번호 설정</h1>
      <p>8자 이상의 새 비밀번호를 입력해줘.</p>
      <form onSubmit={submit}>
        <label>
          새 비밀번호
          <input
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            minLength={8}
            maxLength={100}
            required
            autoComplete="new-password"
          />
        </label>
        <label>
          새 비밀번호 확인
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            minLength={8}
            maxLength={100}
            required
            autoComplete="new-password"
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </div>
  )
}

export default ResetPasswordPage
