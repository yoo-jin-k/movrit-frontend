import { NavLink } from 'react-router-dom'

const menu = [
  ['대시보드', '/admin/dashboard'],
  ['회원', '/admin/members'],
  ['업체', '/admin/sellers'],
  ['인플루언서', '/admin/creators'],
  ['프리오더 심사', '/admin/preorders'],
  ['주문/환불', '/admin/refunds'],
  ['협업/계약', '/admin/collaborations'],
  ['정산', '/admin/settlements'],
  ['공지/콘텐츠', '/admin/content'],
  ['신고/문의', '/admin/inquiries'],
  ['리포트', '/admin/reports'],
  ['설정', '/admin/settings'],
]

export default function AdminLayout({
  title,
  children,
  eyebrow = 'MOVRIT 운영 관리',
  actions,
}) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <strong>MOVRIT</strong>
          <span>ADMIN CONSOLE</span>
        </div>
        <nav aria-label="관리자 메뉴">
          {menu.map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? 'is-active' : '')}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <span className="admin-sidebar__user">관리자 김은영</span>
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
