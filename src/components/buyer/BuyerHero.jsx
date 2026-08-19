import { Link } from 'react-router-dom'
import Button from '../ui/Button'

function BuyerHero() {
  return (
    <section className="buyer-hero" aria-labelledby="buyer-hero-title">
      <div>
        <h2 id="buyer-hero-title" className="buyer-hero__title">사기 전에, 같이 가능성을 만들어요.</h2>
        <p className="buyer-hero__description">모집중인 공구부터 진행중인 공구까지 한눈에.</p>
      </div>
      <Link to="/preorders" className="buyer-hero__cta">
        <Button>전체 프리오더 보기</Button>
      </Link>
    </section>
  )
}

export default BuyerHero
