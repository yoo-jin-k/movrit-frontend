/** 실제 비밀번호 보유 여부를 확인하고 서버 변경 성공 후 다시 로그인하도록 합니다. */
import { passwordValidation, passwordError } from './accountPasswordModel'
import { clearSession } from '../auth/sessionTokenModel'

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BuyerLayout, {
  BuyerCard,
  BuyerButton,
} from '../../components/buyer/BuyerLayout'
import {
  passwordCapability,
  changePassword,
} from '../../api/accountSettingsApi'
export default function AccountPasswordPage() {
  const [cap, setCap] = useState(null),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0),
    [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirm: '',
  })
  const pending = useRef(false)
  const navigate = useNavigate()
  useEffect(() => {
    let active = true
    passwordCapability()
      .then((data) => {
        if (
          typeof data?.canChangePassword !== 'boolean' ||
          typeof data?.hasPassword !== 'boolean'
        )
          throw new Error()
        if (active) {
          setCap(data)
          setError('')
        }
      })
      .catch(() => {
        if (active) setError('비밀번호 변경 가능 여부를 확인하지 못했습니다.')
      })
    return () => {
      active = false
    }
  }, [attempt])
  // 비밀번호는 저장소에 보관하지 않으며 성공 후 현재 브라우저의 세션만 정리합니다.
  const save = async (e) => {
    e.preventDefault()
    if (pending.current || !cap?.canChangePassword) return
    setError('')
    const validation = passwordValidation(form)
    if (validation) {
      setError(validation)
      return
    }
    pending.current = true
    setBusy(true)
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      setForm({ currentPassword: '', newPassword: '', confirm: '' })
      clearSession(sessionStorage, localStorage)
      window.dispatchEvent(new Event('movrit:session-updated'))
      navigate('/login', {
        replace: true,
        state: {
          sessionNotice:
            '비밀번호를 변경했습니다. 새 비밀번호로 다시 로그인해 주세요.',
        },
      })
    } catch (cause) {
      setError(passwordError(cause))
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  return (
    <BuyerLayout title="비밀번호 변경">
      <Link to="/settings">← 계정 설정</Link>
      <BuyerCard title="로그인 비밀번호">
        {error && <p role="alert">{error}</p>}
        {!cap ? (
          <>
            {!error && <p role="status">계정 정보를 확인하고 있습니다.</p>}
            {error && (
              <BuyerButton onClick={() => setAttempt(attempt + 1)}>
                다시 확인
              </BuyerButton>
            )}
          </>
        ) : !cap.canChangePassword || !cap.hasPassword ? (
          <p>
            비밀번호가 없는 소셜 로그인 전용 계정은 기존 비밀번호를 변경할 수
            없습니다. 연결된 소셜 로그인 수단을 이용해 주세요.
          </p>
        ) : (
          <form onSubmit={save}>
            <div className="buyer-form-grid">
              {[
                ['currentPassword', '현재 비밀번호'],
                ['newPassword', '새 비밀번호'],
                ['confirm', '새 비밀번호 확인'],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    type="password"
                    name={key}
                    required
                    maxLength={100}
                    autoComplete={
                      key === 'currentPassword'
                        ? 'current-password'
                        : 'new-password'
                    }
                    value={form[key]}
                    disabled={busy}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
            </div>
            <p>
              새 비밀번호는 영문과 숫자를 포함한 8~100자이며 UTF-8 기준 72바이트
              이내입니다. 변경 후 다시 로그인해 주세요.
            </p>
            <BuyerButton type="submit" variant="primary" disabled={busy}>
              {busy ? '변경 중…' : '비밀번호 변경'}
            </BuyerButton>
          </form>
        )}
      </BuyerCard>
    </BuyerLayout>
  )
}
