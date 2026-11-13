/**
 * 역할 진입 안내·공지·계정 설정·없는 경로 안내 화면을 제공합니다.
 * 보안 설정은 실제 계정 기능으로 연결하며 역할 링크 선택 자체가 서버 권한을 부여하지 않습니다.
 */
import AccountPasswordPage from '../features/membership/AccountPasswordPage'

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CommonLayout from '../components/layout/CommonLayout'
import {
  WITHDRAW_CONFIRM_TEXT,
  readWithdrawalEligibility,
  withdrawMember,
} from '../api/memberWithdrawalApi'

// 이용 서비스 선택(/roles)은 버튼 설명·업체 신청 상태 표시를 위해 RoleSwitchPage.jsx로 옮겼습니다(기존 경로 import 유지용 다시 내보내기).
export { RoleSwitchPage } from './RoleSwitchPage'

// 공지 목록·상세는 커뮤니티와 같은 화면 틀을 쓰도록 NoticePages.jsx로 옮겼습니다(기존 경로 import 유지용 다시 내보내기).
export { NoticeDetailPage, NoticesPage } from './NoticePages'

const termItems = [
  ['서비스 이용약관', '필수 · 동의 완료', '보기'],
  ['개인정보 수집/이용', '필수 · 동의 완료', '보기'],
  ['마케팅 정보 수신', '선택 · 미동의', '동의'],
  ['맞춤 추천을 위한 활동정보 이용', '선택 · 동의', '철회'],
]

function SettingsPage({ title, heading, items }) {
  return (
    <CommonLayout title={title}>
      <p role="note">
        설정 화면 예시입니다. 표시된 보안·동의 상태는 실제 계정 상태가 아니며
        변경은 저장되지 않습니다.
      </p>
      <section className="common-card common-card--settings">
        <h2>{heading}</h2>
        <div className="common-setting-list">
          {items.map(([name, meta, action]) => (
            <article key={name}>
              <div>
                <strong>{name}</strong>
                <small>{meta}</small>
              </div>
              <button
                className={
                  action === '사용중' || action === '동의' ? 'is-primary' : ''
                }
              >
                {action}
              </button>
            </article>
          ))}
        </div>
      </section>
    </CommonLayout>
  )
}
export function SecurityPage() {
  return <AccountPasswordPage />
}
export function TermsPage() {
  return (
    <SettingsPage
      title="약관 및 동의"
      heading="약관 및 동의 현황"
      items={termItems}
    />
  )
}

// 회원 탈퇴 화면입니다. 탈퇴 가능 여부(진행 중인 캠페인 등)를 먼저 보여주고, 확인 문구 '탈퇴합니다'를 입력해야 탈퇴됩니다.
// 탈퇴하면 로그인 정보를 지우고 홈으로 이동합니다. 캠페인·주문 기록은 '탈퇴한 회원'으로 남습니다.
export function WithdrawalPage() {
  const navigate = useNavigate()
  const [check, setCheck] = useState({ loading: true, data: null, error: '' })
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    readWithdrawalEligibility()
      .then((data) => setCheck({ loading: false, data, error: '' }))
      .catch(() =>
        setCheck({
          loading: false,
          data: null,
          error: '탈퇴 가능 여부를 확인하지 못했습니다.',
        }),
      )
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    if (confirmText.trim() !== WITHDRAW_CONFIRM_TEXT) {
      setError(`확인 문구 '${WITHDRAW_CONFIRM_TEXT}'를 정확히 입력해 주세요.`)
      return
    }
    setBusy(true)
    setError('')
    try {
      await withdrawMember(confirmText.trim())
      sessionStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      navigate('/home', { replace: true, state: { withdrawn: true } })
    } catch (failure) {
      setError(
        failure.response?.data?.detail ||
          '탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setBusy(false)
    }
  }

  const blocked = check.data && !check.data.allowed
  return (
    <CommonLayout title="계정 탈퇴">
      <section className="common-card common-card--withdraw">
        <h2>계정 탈퇴</h2>
        <p>탈퇴 전 아래 내용을 확인해 주세요.</p>
        <div className="withdraw-warning">
          <strong>탈퇴하면 복구할 수 없습니다</strong>
          <p>
            • 이메일·닉네임·연락처·프로필 사진이 지워지고 다시 로그인할 수
            없습니다
            <br />• 진행 중인 캠페인(선정·참여 중·콘텐츠 검토)이 있으면 탈퇴할
            수 없습니다
            <br />• 업체는 공개 중인 캠페인을 마감한 뒤 탈퇴할 수 있습니다
            <br />• 캠페인·주문 기록은 정산과 법적 보관을 위해 &lsquo;탈퇴한
            회원&rsquo;으로 남습니다
          </p>
        </div>
        {check.loading ? (
          <p role="status">탈퇴 가능 여부를 확인하고 있습니다.</p>
        ) : check.error ? (
          <p role="alert">{check.error}</p>
        ) : blocked ? (
          <div role="alert" className="withdraw-blocked">
            <strong>지금은 탈퇴할 수 없습니다.</strong>
            <ul>
              {check.data.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <Link to="/mypage/campaigns">내 캠페인 확인하기 →</Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label className="common-field">
              확인 문구 (&lsquo;{WITHDRAW_CONFIRM_TEXT}&rsquo;를 입력해 주세요)
              <input
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder={WITHDRAW_CONFIRM_TEXT}
                autoComplete="off"
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <button
              className="common-button"
              type="submit"
              disabled={busy || confirmText.trim() !== WITHDRAW_CONFIRM_TEXT}
            >
              {busy ? '처리 중...' : '계정 탈퇴'}
            </button>
          </form>
        )}
      </section>
    </CommonLayout>
  )
}

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <CommonLayout title="페이지를 찾을 수 없습니다">
      <section className="common-card common-card--empty">
        <strong>404</strong>
        <h2>페이지를 찾을 수 없습니다</h2>
        <p>주소가 바뀌었거나 삭제된 페이지일 수 있습니다.</p>
        <button className="common-button" onClick={() => navigate('/home')}>
          홈으로 돌아가기
        </button>
      </section>
    </CommonLayout>
  )
}
