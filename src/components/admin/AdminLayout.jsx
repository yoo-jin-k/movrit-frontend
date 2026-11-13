/**
 * 운영 화면의 메뉴·제목·카드·상태·버튼 표현을 공통으로 제공합니다.
 * 이 레이아웃 자체는 권한 조회를 수행하지 않으며 사이드바의 사용자명은 현재 고정 표시값입니다.
 * 메뉴의 모든 화면은 실제 서버 데이터를 씁니다.
 * '업체' 메뉴 옆에는 심사 대기 업체 수를 배지로 보여줍니다(GET /api/admin/sellers/pending, 0건이면 숨김).
 */
import { NavLink } from 'react-router-dom'
import usePendingSellerCount from '../../features/admin/usePendingSellerCount'
import { pendingBadgeText } from '../../features/admin/adminSellerListModel'

const menu = [
  ['대시보드', '/admin/dashboard'],
  ['캠페인 관리', '/admin/campaigns'],
  ['캠페인 참여자', '/admin/campaign-participants'],
  ['콘텐츠 최종 승인', '/admin/content-reviews'],
  ['채널 확인', '/admin/channel-verifications'],
  ['패널티·마감 알림', '/admin/participation'],
  ['메시지', '/admin/messages'],
  ['회원', '/admin/members'],
  ['업체', '/admin/sellers'],
  ['인플루언서', '/admin/creators'],
  ['프리오더 현황', '/admin/preorders'],
  ['주문/환불', '/admin/refunds'],
  ['협업/계약', '/admin/collaborations'],
  ['정산', '/admin/settlements'],
  ['공지/콘텐츠', '/admin/content'],
  ['커뮤니티 관리', '/admin/community'],
  ['신고·제재', '/admin/moderation'],
  ['문의', '/admin/inquiries'],
  ['리포트', '/admin/reports'],
  ['설정', '/admin/settings'],
]

export default function AdminLayout({
  title,
  children,
  eyebrow = 'MOVRIT 운영 관리',
  actions,
}) {
  const pendingSellers = pendingBadgeText(usePendingSellerCount())
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <strong>MOVRIT</strong>
          <span>ADMIN CONSOLE</span>
        </div>
        <nav aria-label="관리자 메뉴">
          {menu.map(([label, to]) => {
            const badge = to === '/admin/sellers' ? pendingSellers : ''
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => (isActive ? 'is-active' : '')}
              >
                {label}
                {badge && (
                  <span className="admin-nav-badge">
                    <span aria-hidden="true">{badge}</span>
                    <span className="sr-only">{`, 심사 대기 ${badge}건`}</span>
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>
        <span className="admin-sidebar__user">운영자 계정</span>
      </aside>
      <main className="admin-main">
        <header className="admin-page-head">
          <div>
            <h1>{title}</h1>
            <p>{eyebrow}</p>
          </div>
          {actions && <div className="admin-page-head__actions">{actions}</div>}
        </header>
        {children}
      </main>
    </div>
  )
}

export function AdminCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={`admin-card ${className}`.trim()}>
      {(title || subtitle) && (
        <header className="admin-card__head">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
        </header>
      )}
      {children}
    </section>
  )
}

export function AdminStatus({ children, tone = 'neutral' }) {
  return (
    <span className={`admin-status admin-status--${tone}`}>{children}</span>
  )
}

export function AdminButton({ children, tone = 'secondary', ...props }) {
  return (
    <button className={`admin-button admin-button--${tone}`} {...props}>
      {children}
    </button>
  )
}
