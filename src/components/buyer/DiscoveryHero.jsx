/**
 * 공동구매 탐색 안내와 프리오더 진입 링크를 표시합니다.
 * '오늘 마감' 숫자는 부르는 쪽이 실제 목록에서 센 값(closingToday)을 넘겨야 보입니다. 값이 없으면 숫자 영역을 숨깁니다.
 */
import { Link } from 'react-router-dom'

function DiscoveryHero({ closingToday = null }) {
  return (
    <section className="discovery-hero">
      <div className="discovery-hero__copy">
        <h1>
          요즘 뜨는 공동구매,
          <br />
          찾아다니지 말고 한곳에서.
        </h1>
        <p>
          MOVRIT에서 열린 공구부터 크리에이터의 SNS 공구까지
          <br />
          관심 있는 공동구매를 빠르게 찾아보세요.
        </p>
        <Link to="/preorders" className="discovery-hero__cta">
          지금 프리오더 →
        </Link>
      </div>
      {closingToday != null && (
        <aside className="discovery-hero__summary">
          <span>오늘 마감</span>
          <strong>{closingToday}</strong>
          <p>개의 공구가 곧 끝나요</p>
          <Link to="/preorders">마감 전에 확인하기 →</Link>
        </aside>
      )}
    </section>
  )
}

export default DiscoveryHero
