import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import ProgressBar from '../ui/ProgressBar'
import StatusBadge from '../ui/StatusBadge'

function PreorderCard({ item, favorite, onToggleFavorite }) {
  const achievement = Number(item.achievementRate || 0)
  return (
    <article className="preorder-card">
      <Link
        to={`/preorders/${item.id}`}
        className="preorder-card__image"
        aria-label={`${item.title} 상세 보기`}
      >
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          'PRODUCT IMAGE'
        )}
      </Link>
      <div className="preorder-card__body">
        <div>
          <StatusBadge>
            {item.status === 'OPEN' ? '진행중' : item.status}
          </StatusBadge>
        </div>
        <div className="preorder-card__meta">
          {item.brandName || 'MOVRIT'} · {item.category || '카테고리'}
        </div>
        <Link to={`/preorders/${item.id}`}>
          <h2 className="preorder-card__title">{item.title}</h2>
        </Link>
        <div className="preorder-card__price">
          {Number(item.preorderPrice || 0).toLocaleString()}원
        </div>
        <ProgressBar value={achievement} />
        <div className="preorder-card__meta">
          {item.orderedQuantity || 0}명 참여 · 목표 {item.targetQuantity || 0}명
          · {achievement.toFixed(0)}%
        </div>
        <div className="preorder-card__footer">
          <Link to={`/preorders/${item.id}`}>
            <Button>상세 보기</Button>
          </Link>
          <Button variant="ghost" onClick={() => onToggleFavorite(item.id)}>
            {favorite ? '♥ 관심 해제' : '♡ 관심 등록'}
          </Button>
        </div>
      </div>
    </article>
  )
}

export default PreorderCard
