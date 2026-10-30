/**
 * 구매자 화면의 공통 헤더·본문·푸터·카드·버튼·토글 모양을 제공합니다.
 * 토글은 기본 체크 상태만 가지며 서버 알림 설정 저장과 연결되어 있지 않습니다.
 */
import AppHeader from '../layout/AppHeader'
import SiteFooter from '../layout/SiteFooter'

export default function BuyerLayout({ title, children, className = '' }) {
  return (
    <div className="buyer-v2">
      <AppHeader />
      <main className={`buyer-v2__main ${className}`.trim()}>
        <h1 className="buyer-v2__title">{title}</h1>
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}

export function BuyerCard({ title, children, className = '' }) {
  return (
    <section className={`buyer-v2-card ${className}`.trim()}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  )
}

export function BuyerButton({ children, variant = 'secondary', ...props }) {
  return (
    <button
      className={`buyer-v2-button buyer-v2-button--${variant}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function BuyerToggle({ label, note, defaultChecked = true }) {
  return (
    <label className="buyer-toggle">
      <span>
        <strong>{label}</strong>
        <small>{note}</small>
      </span>
      <input type="checkbox" defaultChecked={defaultChecked} />
      <i aria-hidden="true" />
    </label>
  )
}
