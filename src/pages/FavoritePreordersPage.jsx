/**
 * 서버 찜 목록을 표시하고 삭제 성공 뒤 해당 항목을 화면에서 제거합니다.
 * 현재 빈 응답에는 예시 목록이 사용되며 조회 오류의 예시 대체는 개발 모드에서만 수행합니다.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getFavoritePreorders,
  removeFavoritePreorder,
} from '../api/favoriteApi'
import BuyerLayout, { BuyerButton } from '../components/buyer/BuyerLayout'

const preview = [
  { preorderId: 1, title: 'Glow Serum 02', brandName: 'LUMENA' },
  { preorderId: 2, title: 'Daily Knit Set', brandName: 'MORNING DEW' },
  { preorderId: 3, title: 'Home Fragrance', brandName: '오르비' },
  { preorderId: 4, title: 'Travel Pouch', brandName: 'BLOOM LAB' },
]
export default function FavoritePreordersPage() {
  const [items, setItems] = useState([])
  useEffect(() => {
    getFavoritePreorders()
      .then((x) => setItems(x.length ? x : preview))
      .catch(() => setItems(import.meta.env.DEV ? preview : []))
  }, [])
  const remove = async (id) => {
    try {
      await removeFavoritePreorder(id)
    } catch (error) {
      console.error(error)
    }
    setItems((current) => current.filter((x) => x.preorderId !== id))
  }
  return (
    <BuyerLayout title="찜한 프리오더">
      <div className="buyer-favorite-grid">
        {items.map((x) => (
          <article key={x.preorderId}>
            <div className="buyer-favorite-card__image" />
            <h2>{x.title}</h2>
            <p>{x.brandName || '힙한 프리오더'}</p>
            <div>
              <Link
                className="buyer-v2-button buyer-v2-button--secondary"
                to={`/preorders/${x.preorderId}`}
              >
                상세 보기
              </Link>
              <BuyerButton
                aria-label={`${x.title} 찜 해제`}
                onClick={() => remove(x.preorderId)}
              >
                ♥
              </BuyerButton>
            </div>
          </article>
        ))}
      </div>
    </BuyerLayout>
  )
}
