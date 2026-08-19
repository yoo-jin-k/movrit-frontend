import { Link } from 'react-router-dom'
import Button from '../ui/Button'

function BuyerHero() {
  return (
    <section className="buyer-hero" aria-labelledby="buyer-hero-title">
      <div>
        <h2 id="buyer-hero-title" className="buyer-hero__title">사기 전에, 같이 가능성을 만들어요.</h2>
        <nav className="buyer-hero__description" aria-label="구매자 안내 메뉴">
          <Link to="/preorders">프리오더</Link>
          <Link to="/preorders">카테고리</Link>
          <Link to="/creator/profile">크리에이터</Link>
          <Link to="/inquiries">공지사항</Link>
        </nav>
      </div>
      <Link to="/preorders" className="buyer-hero__cta">
        <Button>전체 프리오더 보기</Button>
      </Link>
    </section>
  )
}

export default BuyerHero
