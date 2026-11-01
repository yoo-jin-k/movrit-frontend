/**
 * 설정 화면의 'SNS 채널 연결' 영역입니다.
 * - 로그인 연결: 인스타그램(크리에이터·비즈니스)·유튜브·네이버 계정으로 로그인해 바로 '확인됨'이 됩니다.
 * - 직접 등록: 로그인 연결이 안 되는 계정(개인 인스타그램 등)은 주소·팔로워 수·프로필 캡처를 올리고, 운영자가 확인합니다.
 * - 지금은 로그인 연결을 꺼 두어(서버 설정) 직접 등록 → 운영자 확인만 씁니다. 로그인 연결을 켜면(row.available) 버튼과 안내가 함께 나타납니다.
 */
import { useEffect, useState } from 'react'
import {
  disconnectChannel,
  readChannelConnections,
  registerChannelManually,
  startChannelConnection,
} from '../../api/channelConnectApi'
import {
  CHANNEL_PROVIDERS,
  channelErrorMessage,
  connectionBadge,
  followerText,
  manualFormError,
} from './channelConnectModel'

const EMPTY_FORM = { profileUrl: '', followerCount: '', file: null }

export default function ChannelConnections({ notice }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState('')
  const [attempt, setAttempt] = useState(0)
  // 직접 등록 입력을 펼친 서비스와 입력값입니다. 한 번에 하나만 펼칩니다.
  const [manual, setManual] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    const controller = new AbortController()
    readChannelConnections(controller.signal)
      .then((data) => {
        setRows(data)
        setError('')
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError('채널 연결 상태를 불러오지 못했습니다.')
      })
    return () => controller.abort()
  }, [attempt])

  const reload = () => setAttempt((value) => value + 1)

  // 로그인 연결: 서버가 만든 SNS 로그인 주소로 이동합니다. 로그인 후 /channel-connect/callback/{서비스}로 돌아옵니다.
  const connect = async (provider) => {
    setBusy(provider)
    setError('')
    try {
      window.location.assign(await startChannelConnection(provider))
    } catch (failure) {
      setBusy('')
      setError(
        channelErrorMessage(
          failure,
          '연결을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        ),
      )
    }
  }

  // 연결 해제: 연결 기록과 캡처를 지우고 목록을 다시 불러옵니다.
  const disconnect = async (provider) => {
    setBusy(provider)
    setError('')
    setMessage('')
    try {
      await disconnectChannel(provider)
      reload()
    } catch (failure) {
      setError(channelErrorMessage(failure, '연결을 해제하지 못했습니다.'))
    } finally {
      setBusy('')
    }
  }

  const openManual = (provider) => {
    setManual((value) => (value === provider ? '' : provider))
    setForm(EMPTY_FORM)
    setError('')
    setMessage('')
  }

  // 직접 등록: 입력을 먼저 확인하고 캡처와 함께 보냅니다. 등록 후에는 '확인 대기'로 표시됩니다.
  const submitManual = async (event, provider) => {
    event.preventDefault()
    const problem = manualFormError(provider, form)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(provider)
    setError('')
    try {
      await registerChannelManually(provider, {
        profileUrl: form.profileUrl.trim(),
        followerCount: String(form.followerCount).trim(),
        file: form.file,
      })
      setManual('')
      setForm(EMPTY_FORM)
      setMessage(
        `${CHANNEL_PROVIDERS[provider].label} 채널을 등록했습니다. 운영자가 확인하면 알림으로 알려 드립니다.`,
      )
      reload()
    } catch (failure) {
      setError(channelErrorMessage(failure, '채널을 등록하지 못했습니다.'))
    } finally {
      setBusy('')
    }
  }

  return (
    <section id="channel-connect" className="account-settings-group">
      <h2>SNS 채널 연결</h2>
      <p>
        활동 중인 채널을 등록해 주세요. 운영자가 캡처와 실제 채널을 확인하면
        &lsquo;확인됨&rsquo;으로 바뀌고, 브랜드가 신청자의 채널과 팔로워 수를 볼
        수 있습니다.
      </p>
      {notice && (
        <p
          className={`account-social-notice ${notice.ok ? 'is-ok' : 'is-error'}`}
          role={notice.ok ? 'status' : 'alert'}
        >
          {notice.text}
        </p>
      )}
      {message && (
        <p className="account-social-notice is-ok" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="account-social-notice is-error" role="alert">
          {error}
        </p>
      )}
      {!rows && !error && <p role="status">연결 상태를 확인하고 있습니다.</p>}
      {rows && (
        <ul className="account-social-list account-channel-list">
          {rows.map((row) => {
            const info = CHANNEL_PROVIDERS[row.provider] || {
              label: row.label,
            }
            const linked = row.connection
            const badge = connectionBadge(linked)
            const oauthLinked = linked?.method === 'OAUTH'
            return (
              <li key={row.provider}>
                <div className="account-channel-row">
                  <span>
                    <strong>{info.label}</strong>
                    {linked ? (
                      <small>
                        <a
                          href={linked.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {linked.accountName}
                        </a>{' '}
                        · {followerText(row.provider, linked.followerCount)}
                      </small>
                    ) : (
                      <small>
                        {row.available ? info.hint : info.manualHint}
                      </small>
                    )}
                    {badge && (
                      <em className={`account-channel-badge ${badge.tone}`}>
                        {badge.text}
                      </em>
                    )}
                    {linked?.verificationStatus === 'REJECTED' &&
                      linked.reviewNote && (
                        <small className="account-channel-note">
                          반려 사유: {linked.reviewNote}
                        </small>
                      )}
                  </span>
                  <div className="account-channel-actions">
                    {row.available && (
                      <button
                        type="button"
                        onClick={() => connect(row.provider)}
                        disabled={Boolean(busy)}
                      >
                        {busy === row.provider
                          ? '처리 중…'
                          : oauthLinked
                            ? '다시 연결'
                            : '로그인 연결'}
                      </button>
                    )}
                    {!oauthLinked && (
                      <button
                        type="button"
                        className="is-secondary"
                        aria-expanded={manual === row.provider}
                        onClick={() => openManual(row.provider)}
                        disabled={Boolean(busy)}
                      >
                        {linked ? '다시 등록' : '직접 등록'}
                      </button>
                    )}
                    {linked && (
                      <button
                        type="button"
                        className="is-secondary"
                        onClick={() => disconnect(row.provider)}
                        disabled={Boolean(busy)}
                      >
                        해제
                      </button>
                    )}
                  </div>
                </div>
                {row.provider === 'instagram' && row.available && !linked && (
                  <details className="account-channel-tip">
                    <summary>
                      개인 계정인데 팔로워 수를 자동으로 확인받고 싶다면?
                    </summary>
                    <p>
                      인스타그램 앱 → 설정 → 계정 유형 및 도구 → 프로페셔널
                      계정으로 전환 → 크리에이터를 고르면 됩니다. 무료이며
                      사진·팔로워는 그대로이고 언제든 되돌릴 수 있습니다. 전환
                      후 로그인 연결을 눌러 주세요.
                    </p>
                  </details>
                )}
                {manual === row.provider && (
                  <form
                    className="account-channel-form"
                    onSubmit={(event) => submitManual(event, row.provider)}
                  >
                    <p>
                      채널 주소와 수치를 입력하고, 프로필 화면(아이디와{' '}
                      {info.countLabel?.replace('(선택)', '')}가 보이게)을
                      캡처해 올려 주세요. 운영자가 확인하면
                      &lsquo;확인됨&rsquo;으로 바뀝니다.
                    </p>
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
                    <label>
                      {info.countLabel}
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="예: 1200"
                        value={form.followerCount}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            followerCount: event.target.value.replace(
                              /[^\d]/g,
                              '',
                            ),
                          })
                        }
                      />
                    </label>
                    <label>
                      프로필 화면 캡처 (JPG·PNG, 5MB 이하)
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={(event) =>
                          setForm({
                            ...form,
                            file: event.target.files?.[0] || null,
                          })
                        }
                      />
                    </label>
                    <div className="account-channel-actions">
                      <button type="submit" disabled={Boolean(busy)}>
                        {busy === row.provider ? '등록 중…' : '등록하기'}
                      </button>
                      <button
                        type="button"
                        className="is-secondary"
                        onClick={() => openManual('')}
                        disabled={Boolean(busy)}
                      >
                        취소
                      </button>
                    </div>
                  </form>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
