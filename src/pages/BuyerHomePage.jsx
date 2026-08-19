import { useEffect, useMemo, useState } from 'react'
import AppHeader from '../components/layout/AppHeader'
import CreatorCard from '../components/buyer/CreatorCard'
import DiscoveryHero from '../components/buyer/DiscoveryHero'
import DiscoverySection from '../components/buyer/DiscoverySection'
import GroupbuyCard from '../components/buyer/GroupbuyCard'
import { getOpenPreorders } from '../api/commerceApi'
import {
  CATEGORY_FILTERS,
  CLOSING_GROUPBUYS,
  CREATOR_PREVIEWS,
  POPULAR_GROUPBUYS,
  SNS_GROUPBUYS,
} from '../preview/buyerHomePreview'

const toGroupbuyCard = (item) => ({
  id: item.id,
  title: item.title,
  creator: item.creatorName || item.brandName || 'MOVRIT 크리에이터',
  category: item.category || '공구',
  price: Number(item.preorderPrice || item.price || 0),
  discount: Number(item.discountRate || 0),
  deadline: item.daysLeft != null ? `D-${item.daysLeft}` : '진행중',
  source: 'MOVRIT 공구',
  tone: 'gray',
})

function BuyerHomePage() {
  const [items, setItems] = useState([])
  const [category, setCategory] = useState('전체')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getOpenPreorders()
      .then(setItems)
      .catch(() => setError('공구를 불러오지 못했어. 잠시 후 다시 시도해줘.'))
      .finally(() => setLoading(false))
  }, [])

  const popularItems = useMemo(() => {
    const liveItems = items.map(toGroupbuyCard)
    const source = liveItems.length > 0 ? liveItems : import.meta.env.DEV ? POPULAR_GROUPBUYS : []
    return (category === '전체' ? source : source.filter((item) => item.category.includes(category))).slice(0, 4)
  }, [category, items])

  const previewCreators = import.meta.env.DEV ? CREATOR_PREVIEWS : []
  const closingItems = import.meta.env.DEV ? CLOSING_GROUPBUYS : []
  const snsItems = import.meta.env.DEV ? SNS_GROUPBUYS : []

  return (
    <div className="page-shell buyer-home-page">
      <AppHeader />
      <main className="movrit-container discovery-home">
        <DiscoveryHero />

        <nav className="discovery-categories" aria-label="공구 카테고리">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={category === filter ? 'is-active' : ''}
              onClick={() => setCategory(filter)}
            >
              {filter}
            </button>
          ))}
        </nav>

        <DiscoverySection title="지금 인기 공구" description="지금 가장 많은 관심을 받고 있는 공동구매예요.">
          {loading && <div className="discovery-state">공구를 불러오는 중이에요.</div>}
          {!loading && error && <div className="discovery-state discovery-state--error">{error}</div>}
          {!loading && !error && popularItems.length > 0 && (
            <div className="groupbuy-grid">
              {popularItems.map((item) => <GroupbuyCard key={item.id} item={item} />)}
            </div>
          )}
          {!loading && !error && popularItems.length === 0 && <div className="discovery-state">이 카테고리의 공구를 준비 중이에요.</div>}
        </DiscoverySection>

        <DiscoverySection title="내가 좋아할 크리에이터" description="취향이 비슷한 사람들이 많이 찾는 크리에이터예요.">
          {previewCreators.length > 0 ? (
            <div className="creator-discovery-grid">
              {previewCreators.map((creator) => <CreatorCard key={creator.id} creator={creator} />)}
            </div>
          ) : <div className="discovery-state discovery-state--compact">추천 크리에이터를 준비 중이에요.</div>}
        </DiscoverySection>

        <DiscoverySection title="오늘 마감" description="놓치면 아쉬운 공구, 오늘이 지나기 전에 확인해봐요.">
          {closingItems.length > 0 ? (
            <div className="groupbuy-grid">
              {closingItems.map((item) => <GroupbuyCard key={item.id} item={item} />)}
            </div>
          ) : <div className="discovery-state">오늘 마감하는 공구를 준비 중이에요.</div>}
        </DiscoverySection>

        <DiscoverySection
          title="SNS에서 발견한 공구"
          description="MOVRIT 밖에서 열리는 크리에이터 공구도 한곳에서 발견해봐요."
          className="discovery-section--sns"
        >
          <div className="sns-discovery-note">
            <div><strong>SNS 공구도 놓치지 않게</strong><p>여러 채널에 흩어진 공동구매를 MOVRIT이 모아서 보여드려요.</p></div>
            <span>Instagram · YouTube · Blog</span>
          </div>
          {snsItems.length > 0 ? (
            <div className="groupbuy-grid">
              {snsItems.map((item) => <GroupbuyCard key={item.id} item={item} />)}
            </div>
          ) : <div className="discovery-state">SNS 공구를 준비 중이에요.</div>}
        </DiscoverySection>

        <aside className="discovery-guide">
          <div><span>MOVRIT GUIDE</span><h2>공동구매, 이제 헤매지 마세요.</h2><p>좋아하는 크리에이터를 팔로우하고 관심 공구의 마감 알림을 받아보세요.</p></div>
          <a href="/preorders">MOVRIT 시작하기 →</a>
        </aside>
      </main>
    </div>
  )
}

export default BuyerHomePage
