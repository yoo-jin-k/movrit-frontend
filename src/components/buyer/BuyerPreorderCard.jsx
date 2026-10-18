/**
 * 프리오더 가격·마감 상태·썸네일을 표시하고 상세 경로로 연결합니다.
 * 디자인 예시 ID는 실상품 상세로 보내지 않고 목록 경로를 사용합니다.
 */
import { Link } from 'react-router-dom'

function BuyerPreorderCard({ item }) {
  const price = Number(item.preorderPrice || 0).toLocaleString()
  const deadline =
    item.daysLeft != null
      ? `D-${item.daysLeft}`
      : item.status === 'OPEN'
        ? '진행중'
        : item.status
  const detailUrl = String(item.id).startsWith('figma-preview-')
    ? '/preorders'
    : `/preorders/${item.id}`

  return (
    <article
      className="buyer-preorder-card"
      data-status={item.status || 'OPEN'}
    >
      <Link
        to={detailUrl}
        className={`buyer-preorder-card__image${item.previewTone ? ` buyer-preorder-card__image--${item.previewTone}` : ''}`}
        aria-label={`${item.title} 상세 보기`}
      >
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={`${item.title} 상품`} />
        ) : (
          <span className="buyer-preorder-card__placeholder" aria-hidden="true">
            <small>{item.category || 'MOVRIT'}</small>
            <strong>{item.title.slice(0, 1)}</strong>
          </span>
        )}
      </Link>
      <div className="buyer-preorder-card__body">
        <Link to={detailUrl} className="buyer-preorder-card__title">
          {item.title}
        </Link>
        <p className="buyer-preorder-card__meta">
          {item.brandName || 'MOVRIT'} × {item.creatorName || '크리에이터'}
        </p>
        <div className="buyer-preorder-card__bottom">
          <strong>{price}원</strong>
          <span>{deadline}</span>
        </div>
      </div>
    </article>
  )
}

export default BuyerPreorderCard
