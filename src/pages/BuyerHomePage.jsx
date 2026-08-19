import { useEffect, useMemo, useState } from 'react'
import AppHeader from '../components/layout/AppHeader'
import BuyerHero from '../components/buyer/BuyerHero'
import BuyerFilterChips from '../components/buyer/BuyerFilterChips'
import BuyerPreorderCard from '../components/buyer/BuyerPreorderCard'
import { getOpenPreorders } from '../api/commerceApi'
import { BUYER_HOME_PREVIEW_ITEMS } from '../preview/buyerHomePreview'

function BuyerHomePage() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('closing')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getOpenPreorders()
      .then(setItems)
      .catch(() => setError('프리오더를 불러오지 못했어. 잠시 후 다시 시도해줘.'))
      .finally(() => setLoading(false))
  }, [])

  const displayItems = items.length > 0 || !import.meta.env.DEV ? items : BUYER_HOME_PREVIEW_ITEMS

  const visibleItems = useMemo(() => {
    const copied = [...displayItems]
    if (filter === 'popular') return copied.sort((a, b) => Number(b.orderedQuantity || 0) - Number(a.orderedQuantity || 0)).slice(0, 4)
    if (filter === 'new') return copied.sort((a, b) => Number(b.id || 0) - Number(a.id || 0)).slice(0, 4)
    if (filter === 'beauty') return copied.filter((item) => String(item.category || '').includes('뷰티')).slice(0, 4)
    if (filter === 'fashion') return copied.filter((item) => String(item.category || '').includes('패션')).slice(0, 4)
    return copied.sort((a, b) => Number(b.achievementRate || 0) - Number(a.achievementRate || 0)).slice(0, 4)
  }, [displayItems, filter])

  return (
    <div className="page-shell buyer-home-page">
      <AppHeader />
      <main className="movrit-container buyer-home">
        <h1 className="buyer-home__title">지금 열려 있는 프리오더</h1>
        <BuyerHero />
        <BuyerFilterChips value={filter} onChange={setFilter} />

        {loading && <div className="buyer-home__state">프리오더를 불러오는 중이야.</div>}
        {!loading && error && <div className="buyer-home__state buyer-home__state--error">{error}</div>}
        {!loading && !error && visibleItems.length === 0 && <div className="buyer-home__state">조건에 맞는 프리오더가 아직 없어.</div>}
        {!loading && !error && visibleItems.length > 0 && (
          <section className="buyer-home__grid" aria-label="프리오더 목록">
            {visibleItems.map((item) => <BuyerPreorderCard key={item.id} item={item} />)}
          </section>
        )}
      </main>
    </div>
  )
}

export default BuyerHomePage
