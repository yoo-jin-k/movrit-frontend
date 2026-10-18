/**
 * 전달된 공동구매 소개·가격·마감 정보를 표시합니다.
 * 숫자 ID만 실제 프리오더 상세로 연결하고 예시 문자열 ID는 목록으로 안내합니다.
 */
import { Link } from 'react-router-dom'

function GroupbuyCard({ item }) {
  const detailUrl =
    typeof item.id === 'number' ? `/preorders/${item.id}` : '/preorders'

  return (
    <article className="groupbuy-card">
      <Link
        to={detailUrl}
        className={`groupbuy-card__visual groupbuy-card__visual--${item.tone}`}
        aria-label={`${item.title} 상세 보기`}
      >
        <span>{item.source}</span>
        <em>{item.deadline}</em>
        <i aria-hidden="true">{item.title.slice(0, 1)}</i>
      </Link>
      <div className="groupbuy-card__creator">
        <b>{item.category.slice(0, 2)}</b>
        <span>{item.creator}</span>
      </div>
      <Link to={detailUrl} className="groupbuy-card__title">
        {item.title}
      </Link>
      <div className="groupbuy-card__price">
        <strong>{item.discount}%</strong>
        <b>{item.price.toLocaleString()}원</b>
      </div>
    </article>
  )
}

export default GroupbuyCard
