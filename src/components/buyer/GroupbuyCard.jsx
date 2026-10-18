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
