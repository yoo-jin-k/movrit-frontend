import AppHeader from '../layout/AppHeader'

export default function BuyerLayout({ title, children, className = '' }) {
  return <div className="buyer-v2"><AppHeader/><main className={`buyer-v2__main ${className}`.trim()}><h1 className="buyer-v2__title">{title}</h1>{children}</main></div>
}

export function BuyerCard({ title, children, className = '' }) {
  return <section className={`buyer-v2-card ${className}`.trim()}>{title && <h2>{title}</h2>}{children}</section>
}

export function BuyerButton({ children, variant = 'secondary', ...props }) {
  return <button className={`buyer-v2-button buyer-v2-button--${variant}`} {...props}>{children}</button>
}

export function BuyerToggle({ label, note, defaultChecked = true }) {
  return <label className="buyer-toggle"><span><strong>{label}</strong><small>{note}</small></span><input type="checkbox" defaultChecked={defaultChecked}/><i aria-hidden="true"/></label>
}
