/**
 * 내 업체 프로필을 조회하여 APPROVED 상태에만 중첩 업체 화면을 열어 줍니다.
 * 로딩·심사 미승인·조회 실패를 구분하고 승인된 프로필을 하위 화면에 전달합니다.
 */
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { getMySellerProfile } from '../../api/sellerApi'
import './business.css'
import BusinessIcon from './BusinessIcon'
import useChatUnread from '../chat/useChatUnread'
const menus = [
  ['dashboard', '홈'],
  ['campaigns', '캠페인'],
  ['participants', '참여자'],
  ['contents', '콘텐츠'],
  ['inbox', '알림·문의'],
  ['messages', '메시지'],
  ['settings', '업체 설정'],
]
export default function BusinessShell() {
  // 메시지 메뉴에 안 읽은 채팅 수를 배지로 보여줍니다.
  const chatUnread = useChatUnread()
  const [profile, setProfile] = useState(null),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    getMySellerProfile()
      .then((value) => {
        if (active) setProfile(value)
      })
      .catch(() => {
        if (active)
          setError(
            '업체 정보를 확인하지 못했습니다. 등록·승인 상태를 확인해 주세요.',
          )
      })
    return () => {
      active = false
    }
  }, [attempt])
  return (
    <div className="business-shell">
      <a className="business-skip" href="#business-main">
        본문으로 이동
      </a>
      <header className="business-top">
        <Link to="/seller/dashboard" className="business-logo">
          MOVRIT
        </Link>
        <span>업체 관리</span>
        <Link className="business-service" to="/home">
          사용자 서비스 ↗
        </Link>
        <Link
          to="/seller/inbox"
          className="business-header-notifications"
          aria-label="업체 알림"
        >
          <BusinessIcon name="inbox" />
        </Link>
        <Link
          to="/seller/settings"
          className="business-account"
          aria-label="업체 설정"
        >
          <span className="business-avatar" aria-hidden="true">
            {(profile?.brandName || profile?.businessName || 'M').slice(0, 1)}
          </span>
          <span>
            {profile?.brandName || profile?.businessName || '내 업체'}
          </span>
        </Link>
      </header>
      <div className="business-layout">
        <aside className="business-sidebar">
          <div className="business-company">
            <span className="business-avatar">M</span>
            <strong>
              {profile?.brandName || profile?.businessName || '내 업체'}
            </strong>
            <small>
              {profile?.status === 'APPROVED'
                ? '승인된 업체'
                : '업체 상태 확인'}
            </small>
          </div>
          <nav aria-label="업체 업무 메뉴">
            {menus.map(([path, label]) => (
              <NavLink key={path} to={`/seller/${path}`}>
                <BusinessIcon name={path} />
                {label}
                {path === 'messages' && chatUnread > 0 && (
                  <em
                    className="chat-nav-badge"
                    aria-label={`안 읽은 메시지 ${chatUnread}개`}
                  >
                    {chatUnread > 99 ? '99+' : chatUnread}
                  </em>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="business-sidebar-bottom">
            <p>
              캠페인의 시작부터
              <br />
              콘텐츠 검토까지
            </p>
            <Link to="/seller/operations">기존 주문·배송 관리 →</Link>
          </div>
        </aside>
        <main id="business-main" className="business-main">
          {error ? (
            <div className="business-empty" role="alert">
              <p>{error}</p>
              <button
                onClick={() => {
                  setError('')
                  setAttempt((v) => v + 1)
                }}
              >
                다시 확인
              </button>
              <Link to="/seller/apply">업체 등록 상태 확인</Link>
            </div>
          ) : !profile ? (
            <p role="status">업체 정보를 확인하고 있습니다.</p>
          ) : profile.status !== 'APPROVED' ? (
            <div className="business-empty">
              <h1>업체 승인 후 이용하실 수 있습니다.</h1>
              <p>현재 상태: {profile.status}</p>
              <Link to="/seller/apply">등록 상태 확인</Link>
            </div>
          ) : (
            <Outlet context={{ profile }} />
          )}
        </main>
      </div>
    </div>
  )
}
