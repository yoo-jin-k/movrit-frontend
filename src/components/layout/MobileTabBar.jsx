/**
 * 640px 이하 화면에서만 보이는 하단 고정 탭 바입니다.
 * 홈·카테고리·내 캠페인·알림·마이페이지로 한 번에 이동할 수 있게 합니다.
 * 데스크톱에서는 CSS로 숨기며, 하단 신청 바가 있는 캠페인 상세에서는 신청 바를 우선해 숨깁니다.
 */
import { NavLink } from 'react-router-dom'
import useUnreadNotifications from '../../features/notifications/useUnreadNotifications'
import { unreadBadgeText } from '../../features/notifications/notificationBadge'

// [이름, 경로, 아이콘 path] 목록입니다. 아이콘은 24px 선 아이콘으로 단순하게 그립니다.
const TABS = [
  ['홈', '/home', 'M4 11l8-7 8 7v9h-5v-6H9v6H4z'],
  ['카테고리', '/category/제품', 'M4 6h16M4 12h16M4 18h16'],
  ['내 캠페인', '/mypage/campaigns', 'M6 4h12v16H6zM9 9h6M9 13h6M9 17h3'],
  [
    '알림',
    '/notifications',
    'M6 16V11a6 6 0 1112 0v5l2 2H4zM10 20a2 2 0 004 0',
  ],
  ['마이', '/mypage', 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0'],
]

export default function MobileTabBar() {
  // 알림 탭에 읽지 않은 알림 개수를 배지로 표시합니다.
  const badge = unreadBadgeText(useUnreadNotifications())
  return (
    <nav className="mobile-tabbar" aria-label="모바일 주요 메뉴">
      {TABS.map(([label, to, path]) => (
        <NavLink
          key={to}
          to={to}
          // 마이 탭은 하위 경로(/mypage/campaigns 등)와 겹치므로 정확히 일치할 때만 활성 표시합니다.
          end={to === '/mypage' || to === '/home'}
          className={({ isActive }) => (isActive ? 'is-active' : undefined)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d={path}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{label}</span>
          {to === '/notifications' && badge && (
            <em
              className="mobile-tabbar__badge"
              aria-label={`읽지 않은 알림 ${badge}개`}
            >
              {badge}
            </em>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
