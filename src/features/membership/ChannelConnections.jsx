/**
 * 설정 화면의 'SNS 채널 연결' 영역입니다.
 * - 인스타그램·유튜브·네이버 블로그 계정을 실제 로그인으로 연결합니다.
 * - 연결하면 계정 이름·채널 주소·팔로워(구독자) 수를 가져와 브랜드가 참여자 채널을 확인할 수 있습니다.
 * - 서버에 연동 키가 없는 서비스는 '준비 중'으로 보이고 버튼이 비활성화됩니다.
 */
import { useEffect, useState } from 'react'
import {
  disconnectChannel,
  readChannelConnections,
  startChannelConnection,
} from '../../api/channelConnectApi'
import {
  CHANNEL_PROVIDERS,
  channelErrorMessage,
  followerText,
} from './channelConnectModel'

export default function ChannelConnections({ notice }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [attempt, setAttempt] = useState(0)

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

  // 연결하기: 서버가 만든 SNS 로그인 주소로 이동합니다. 로그인 후 /channel-connect/callback/{서비스}로 돌아옵니다.
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

  // 연결 해제: 연결 기록을 지우고 목록을 다시 불러옵니다.
  const disconnect = async (provider) => {
    setBusy(provider)
    setError('')
    try {
      await disconnectChannel(provider)
      setAttempt((value) => value + 1)
    } catch (failure) {
      setError(channelErrorMessage(failure, '연결을 해제하지 못했습니다.'))
    } finally {
      setBusy('')
    }
  }

  return (
    <section id="channel-connect" className="account-settings-group">
      <h2>SNS 채널 연결</h2>
      <p>
        활동 중인 채널을 연결하면 브랜드가 신청자의 채널과 팔로워 수를 바로
        확인할 수 있습니다. 비밀번호와 접근 권한은 MOVRIT에 저장되지 않습니다.
      </p>
      {notice && (
        <p
          className={`account-social-notice ${notice.ok ? 'is-ok' : 'is-error'}`}
          role={notice.ok ? 'status' : 'alert'}
        >
          {notice.text}
        </p>
      )}
      {error && (
        <p role="alert">
          {error}{' '}
          <button type="button" onClick={() => setAttempt((v) => v + 1)}>
            다시 확인
          </button>
        </p>
      )}
      {!rows && !error && <p role="status">연결 상태를 확인하고 있습니다.</p>}
      {rows && (
        <ul className="account-social-list account-channel-list">
          {rows.map((row) => {
            const info = CHANNEL_PROVIDERS[row.provider] || { label: row.label }
            const linked = row.connection
            return (
              <li key={row.provider}>
                <span>
                  <strong>{info.label}</strong>
                  {linked ? (
                    <small>
                      <a
                        href={linked.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {linked.accountName}
                      </a>{' '}
                      · {followerText(row.provider, linked.followerCount)}
                    </small>
                  ) : (
                    <small>
                      {row.available
                        ? info.hint
                        : '준비 중입니다. 운영자가 연동 키를 등록하면 연결할 수 있습니다.'}
                    </small>
                  )}
                </span>
                <div className="account-channel-actions">
                  {linked && <em>연결됨</em>}
                  {row.available && (
                    <button
                      type="button"
                      onClick={() => connect(row.provider)}
                      disabled={Boolean(busy)}
                    >
                      {busy === row.provider
                        ? '이동 중…'
                        : linked
                          ? '다시 연결'
                          : '연결하기'}
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
                  {!row.available && !linked && (
                    <em className="is-muted">준비 중</em>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
