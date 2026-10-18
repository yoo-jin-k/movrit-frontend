/**
 * 인증번호 발송과 확인, 만료까지 남은 시간을 화면 상태로 관리합니다.
 * 발송 요청 ID와 번호를 확인 요청에 묶고 완료 후 부모가 최신 인증 상태를 다시 읽도록 합니다.
 */
import { participationError } from './participationError'
import { useEffect, useState } from 'react'
import { seoulInstant } from './scheduleModel'

// 발송과 확인 응답만 표시하며 이메일 확인을 실명 인증으로 표시하지 않습니다.
export default function EmailVerificationPanel({
  email,
  verified,
  requestCode,
  confirmCode,
  onVerified,
}) {
  const [challenge, setChallenge] = useState(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!challenge) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [challenge])
  const expires = challenge ? seoulInstant(challenge.expiresAt) : null
  const remaining =
    expires == null ? null : Math.max(0, Math.ceil((expires - now) / 1000))
  // 서버가 발급한 요청 정보를 새 인증 시도로 보관하고 이전 번호 입력은 초기화합니다.
  const send = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const next = await requestCode()
      setChallenge(next)
      setCode('')
      setNow(Date.now())
    } catch (failure) {
      setError(
        participationError(
          failure,
          '인증번호를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.',
        ),
      )
    } finally {
      setBusy(false)
    }
  }
  // 현재 발송 요청과 번호를 함께 확인한 뒤 부모에게 최신 이메일 상태 재조회를 요청합니다.
  const confirm = async (event) => {
    event.preventDefault()
    if (busy || remaining === 0) return
    setBusy(true)
    setError('')
    try {
      const result = await confirmCode({
        challengeId: challenge.challengeId,
        code,
      })
      if (result.emailVerified !== true)
        throw new Error('이메일 인증 완료 상태를 확인하지 못했습니다.')
      setCode('')
      setChallenge(null)
      await onVerified()
    } catch (failure) {
      setError(
        participationError(
          failure,
          '인증 결과를 확인하지 못했습니다. 인증 상태를 다시 확인해 주세요.',
        ),
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="application-status" aria-label="이메일 인증">
      <h3>이메일 인증</h3>
      <p>계정 이메일: {email || '계정 정보 확인 필요'}</p>
      <p>
        이메일 소유 확인을 임시 참여 조건으로 사용합니다. 실명 본인인증과는
        별개입니다.
      </p>
      {verified ? (
        <p role="status">이메일 인증 완료</p>
      ) : (
        <>
          <button
            type="button"
            className="discovery-outline-button"
            disabled={busy || !email}
            onClick={send}
          >
            {busy
              ? '처리 중입니다…'
              : challenge
                ? '인증번호 재발송'
                : '인증번호 요청'}
          </button>
          {challenge && (
            <form onSubmit={confirm} className="application-fieldset">
              <p role="status">
                {challenge.maskedEmail}로 인증번호를 전송했습니다.
              </p>
              <p>
                {remaining === 0
                  ? '인증번호가 만료되었습니다. 재발송해 주세요.'
                  : `남은 시간 ${Math.floor(remaining / 60)}분 ${remaining % 60}초`}
              </p>
              <label>
                인증번호
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  disabled={busy || remaining === 0}
                />
              </label>
              <button
                type="submit"
                className="discovery-outline-button"
                disabled={busy || remaining === 0}
              >
                인증번호 확인
              </button>
            </form>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}
