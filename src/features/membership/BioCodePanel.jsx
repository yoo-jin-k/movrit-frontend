/**
 * 설정 > SNS 채널 연결의 '소개글 코드 인증' 영역입니다(인스타그램·네이버 블로그).
 * - 인증 코드를 받아(24시간 유효) 소개글에 붙여 넣고, 채널 주소를 넣어 확인하면 서버가 공개 정보에서 코드를 찾아 바로 '확인됨'으로 등록합니다.
 * - 인스타그램을 자동으로 확인할 수 없으면(서버 조회 키 없음·개인 계정) 팔로워 수를 받아 운영자 확인으로 넘깁니다.
 * - 같은 코드로 확인은 10번까지, 코드는 하루 5번까지 새로 받을 수 있습니다(서버 기준).
 */
import { useEffect, useState } from 'react'
import {
  issueBioCode,
  readBioCode,
  verifyBioCode,
} from '../../api/channelConnectApi'
import {
  CHANNEL_PROVIDERS,
  bioCodeMeta,
  bioCodeSteps,
  bioFormError,
  channelErrorMessage,
} from './channelConnectModel'

export default function BioCodePanel({ provider, onDone, onClose }) {
  const info = CHANNEL_PROVIDERS[provider]
  const [code, setCode] = useState(undefined)
  const [form, setForm] = useState({ profileUrl: '', followerCount: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // 쓸 수 있는 코드가 이미 있으면 보여 주고, 없으면 '코드 받기' 버튼을 보여 줍니다.
  useEffect(() => {
    const controller = new AbortController()
    readBioCode(provider, controller.signal)
      .then(setCode)
      .catch(() => {
        if (!controller.signal.aborted) setCode(null)
      })
    return () => controller.abort()
  }, [provider])

  const issue = async () => {
    setBusy(true)
    setError('')
    try {
      setCode(await issueBioCode(provider))
    } catch (failure) {
      setError(channelErrorMessage(failure, '인증 코드를 받지 못했습니다.'))
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code.code)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const verify = async (event) => {
    event.preventDefault()
    const problem = bioFormError(provider, form, code?.autoCheck)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await verifyBioCode(provider, {
        profileUrl: form.profileUrl.trim(),
        followerCount: form.followerCount,
      })
      onDone(result.message, result.result)
    } catch (failure) {
      setError(channelErrorMessage(failure, '소개글을 확인하지 못했습니다.'))
      // 확인 횟수가 줄었으므로 남은 횟수를 다시 불러옵니다.
      readBioCode(provider)
        .then(setCode)
        .catch(() => {})
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="account-channel-form account-bio-code"
      aria-label={`${info.label} 소개글 코드 인증`}
      onSubmit={verify}
    >
      <p>
        소개글에 인증 코드를 넣으면 MOVRIT이 그 채널의 주인인지 확인합니다.
        캡처를 올리지 않아도 됩니다.
      </p>
      {code === undefined ? (
        <p role="status">인증 코드를 확인하고 있습니다.</p>
      ) : code ? (
        <>
          <div className="account-bio-code__code">
            <code aria-label="인증 코드">{code.code}</code>
            <button type="button" className="is-secondary" onClick={copy}>
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
          <small>{bioCodeMeta(code)}</small>
          <ol className="account-bio-code__steps">
            {bioCodeSteps(provider, code.autoCheck).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <label>
            채널 주소
            <input
              type="url"
              inputMode="url"
              placeholder={info.example}
              value={form.profileUrl}
              onChange={(event) =>
                setForm({ ...form, profileUrl: event.target.value })
              }
            />
          </label>
          {provider === 'instagram' && (
            <label>
              {code.autoCheck
                ? '팔로워 수 (개인 계정이라 자동 확인이 안 될 때 필요)'
                : '팔로워 수'}
              <input
                type="text"
                inputMode="numeric"
                placeholder="예: 1200"
                value={form.followerCount}
                onChange={(event) =>
                  setForm({
                    ...form,
                    followerCount: event.target.value.replace(/[^\d]/g, ''),
                  })
                }
              />
            </label>
          )}
        </>
      ) : (
        <button type="button" onClick={issue} disabled={busy}>
          {busy ? '받는 중…' : '인증 코드 받기'}
        </button>
      )}
      {error && (
        <p className="account-social-notice is-error" role="alert">
          {error}
        </p>
      )}
      <div className="account-channel-actions">
        {code && (
          <button type="submit" disabled={busy}>
            {busy ? '확인 중…' : '소개글 확인하기'}
          </button>
        )}
        <button
          type="button"
          className="is-secondary"
          onClick={onClose}
          disabled={busy}
        >
          닫기
        </button>
      </div>
    </form>
  )
}
