/**
 * 설정 화면의 '휴대폰 인증' 영역입니다.
 * - 번호 입력 → 인증번호 받기 → 6자리 입력 → 확인하면 회원 연락처가 '인증됨'이 됩니다. 인증번호는 5분 동안 쓸 수 있습니다.
 * - 인증된 번호는 회원 한 명만 쓸 수 있어, 같은 사람이 여러 계정으로 패널티·신청 제한을 피하지 못하게 합니다.
 * - 로컬 시연 환경은 문자를 보내지 않고 인증번호를 화면에 보여 줍니다(서버가 시연 모드일 때만 응답에 담겨 옴).
 * - 남용 제한(서버 기준): 재발송 1분 간격, 1시간 5번, 같은 번호 하루 10번, 틀린 입력 5번이면 인증번호를 다시 받아야 합니다.
 */
import { useEffect, useState } from 'react'
import {
  confirmPhoneCode,
  readPhoneStatus,
  requestPhoneCode,
} from '../../api/phoneVerificationApi'
import { workspaceTime } from './campaignWorkspaceModel'
import {
  codeError,
  formatPhoneInput,
  phoneError,
  remainingText,
} from './phoneVerificationModel'

const detail = (failure, fallback) =>
  failure?.response?.data?.detail || failure?.message || fallback

export default function PhoneVerification() {
  const [status, setStatus] = useState(null)
  const [editing, setEditing] = useState(false)
  const [phone, setPhone] = useState('')
  const [sent, setSent] = useState(null)
  const [code, setCode] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    readPhoneStatus(controller.signal)
      .then(setStatus)
      .catch(() => {
        if (!controller.signal.aborted)
          setError('휴대폰 인증 상태를 불러오지 못했습니다.')
      })
    return () => controller.abort()
  }, [])

  // 인증번호를 보낸 뒤에는 남은 시간을 1초마다 다시 그립니다.
  useEffect(() => {
    if (!sent) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [sent])

  const leftSeconds = sent ? (sent.deadline - now) / 1000 : 0

  const send = async () => {
    const problem = phoneError(phone)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const data = await requestPhoneCode(phone)
      // 남은 시간은 서버 만료 시각 대신 받은 시각 + 5분으로 셉니다(기기 시간대 차이를 피함).
      setSent({ ...data, deadline: Date.now() + 5 * 60 * 1000 })
      setCode('')
      setNow(Date.now())
    } catch (failure) {
      setError(detail(failure, '인증번호를 보내지 못했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  const confirm = async (event) => {
    event.preventDefault()
    const problem = codeError(code)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError('')
    try {
      const next = await confirmPhoneCode(sent.challengeId, code.trim())
      setStatus(next)
      setSent(null)
      setEditing(false)
      setPhone('')
      setCode('')
      setNotice('휴대폰 인증을 마쳤습니다.')
    } catch (failure) {
      setError(detail(failure, '인증번호를 확인하지 못했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  const verified = status?.phoneVerified
  const showForm = status && (!verified || editing)
  return (
    <section id="phone-verify" className="account-settings-group">
      <h2>휴대폰 인증</h2>
      <p>
        본인 휴대폰 번호를 인증해 주세요. 인증한 번호는 한 계정에서만 쓸 수
        있습니다.
      </p>
      {notice && (
        <p className="account-social-notice is-ok" role="status">
          {notice}
        </p>
      )}
      {!status && !error && <p role="status">인증 상태를 확인하고 있습니다.</p>}
      {verified && !editing && (
        <div className="account-phone-verified">
          <span>
            <strong>{status.maskedPhone}</strong>{' '}
            <em className="account-channel-badge is-ok">인증됨</em>
            <small>{workspaceTime(status.phoneVerifiedAt)} 인증</small>
          </span>
          <button
            type="button"
            className="is-secondary"
            onClick={() => {
              setEditing(true)
              setNotice('')
            }}
          >
            번호 변경
          </button>
        </div>
      )}
      {showForm && (
        <form
          className="account-channel-form account-phone-form"
          onSubmit={confirm}
        >
          <label>
            휴대폰 번호
            <span className="account-phone-row">
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                disabled={busy}
              />
              <button type="button" onClick={send} disabled={busy}>
                {sent ? '다시 받기' : '인증번호 받기'}
              </button>
            </span>
          </label>
          {sent && (
            <>
              <p>
                {sent.maskedPhone}로 인증번호를 보냈습니다.{' '}
                {leftSeconds > 0
                  ? `남은 시간 ${remainingText(leftSeconds)}`
                  : '시간이 지났습니다. 인증번호를 다시 받아 주세요.'}
              </p>
              {sent.localPreviewCode && (
                <p className="account-phone-preview" role="note">
                  시연 환경이라 문자를 보내지 않습니다. 인증번호:{' '}
                  <strong>{sent.localPreviewCode}</strong>
                </p>
              )}
              <label>
                인증번호
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="6자리"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setError('')
                  }}
                  disabled={busy}
                />
              </label>
            </>
          )}
          {error && (
            <p className="account-social-notice is-error" role="alert">
              {error}
            </p>
          )}
          <div className="account-channel-actions">
            {sent && (
              <button type="submit" disabled={busy || leftSeconds <= 0}>
                {busy ? '확인 중…' : '인증하기'}
              </button>
            )}
            {verified && (
              <button
                type="button"
                className="is-secondary"
                onClick={() => {
                  setEditing(false)
                  setSent(null)
                  setError('')
                }}
                disabled={busy}
              >
                취소
              </button>
            )}
          </div>
        </form>
      )}
      {!showForm && error && (
        <p className="account-social-notice is-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
