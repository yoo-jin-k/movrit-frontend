/**
 * 탐색 화면의 제목·설명·전체보기 링크와 카드 영역을 감쌉니다.
 * 항목 조회와 필터링은 children을 구성하는 부모 화면이 담당합니다.
 */
import { Link } from 'react-router-dom'

function DiscoverySection({ title, description, children, className = '' }) {
  return (
    <section className={`discovery-section ${className}`}>
      <header className="discovery-section__header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <Link to="/preorders">전체보기 →</Link>
      </header>
      {children}
    </section>
  )
}

export default DiscoverySection
