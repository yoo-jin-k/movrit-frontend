/**
 * 설정 화면의 '로그인 연결' 영역입니다.
 * 한 사람이 Google·카카오로 각각 가입해 계정이 둘로 나뉘지 않도록,
 * 로그인한 계정에 다른 소셜 로그인 수단을 직접 연결할 수 있게 합니다.
 * 연결은 서버가 서명한 state를 포함한 인증 주소로 이동해 처리하며, 결과는 /social-link/callback에서 이 화면으로 돌아와 표시합니다.
 */
import { useEffect, useState } from 'react'
import {
  getGoogleLinkUrl,
  getKakaoLinkUrl,
  getSocialAccounts,
} from '../../api/authApi'
import { socialLinkRows } from './socialLinkModel'

// 제공자별 연결 시작 주소 조회 함수입니다.
const LINK_URL = { GOOGLE: getGoogleLinkUrl, KAKAO: getKakaoLinkUrl }

export default function SocialLoginLinks({ notice }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    getSocialAccounts()
      .then((accounts) => {
        const next = socialLinkRows(accounts)
        if (!next) throw new Error('연결 목록 형식을 확인할 수 없습니다.')
        if (active) {
          setRows(next)
          setError('')
        }
      })
      .catch(() => {
        if (active) setError('로그인 연결 상태를 불러오지 못했습니다.')
      })
    return () => {
      active = false
    }
  }, [attempt])

  // 연결 버튼: 서버에서 서명된 연결 주소를 받아 해당 서비스 동의 화면으로 이동합니다.
  const startLink = async (code) => {
    setBusy(code)
    setError('')
    try {
      window.location.assign(await LINK_URL[code]())
    } catch {
      setBusy('')
      setError('연결을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  return (
    <section id="social-login" className="account-settings-group">
      <h2>로그인 연결</h2>
      <p>
        Google과 카카오를 한 계정에 연결해 두면 어느 쪽으로 로그인해도 같은
        계정을 사용합니다.
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
        <ul className="account-social-list">
          {rows.map((row) => (
            <li key={row.code}>
              <span>
                <strong>{row.label}</strong>
                <small>
                  {row.linked ? row.email || '연결됨' : '연결 안 됨'}
                </small>
              </span>
              {row.linked ? (
                <em>연결됨</em>
              ) : (
                <button
                  type="button"
                  onClick={() => startLink(row.code)}
                  disabled={Boolean(busy)}
                >
                  {busy === row.code ? '이동 중…' : '연결하기'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
