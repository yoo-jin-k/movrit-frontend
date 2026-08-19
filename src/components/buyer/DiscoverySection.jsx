import { Link } from 'react-router-dom'

function DiscoverySection({ title, description, children, className = '' }) {
  return (
    <section className={`discovery-section ${className}`}>
      <header className="discovery-section__header">
        <div><h2>{title}</h2><p>{description}</p></div>
        <Link to="/preorders">전체보기 →</Link>
      </header>
      {children}
    </section>
  )
}

export default DiscoverySection
