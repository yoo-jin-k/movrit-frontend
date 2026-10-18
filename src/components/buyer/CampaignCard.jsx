/**
 * 실제 캠페인·프리오더와 미리보기 항목의 상세 경로를 구분합니다.
 * 미리보기 찜만 세션 상태를 변경하며 실제 캠페인 카드에 가짜 신청 인원이나 찜 저장 성공을 추가하지 않습니다.
 */
import { usePreviewFavorite } from '../../features/discovery/usePreviewFavorite'
import { Link } from 'react-router-dom'

// 카드 이동과 미리보기 찜을 분리하여 중첩 링크와 상태 불일치를 방지합니다.
export default function CampaignCard({ item }) {
  const [saved, toggleSaved] = usePreviewFavorite(item.id)
  return (
    <article className="main-campaign-card">
      <Link
        className="main-campaign-card__content"
        to={
          item.preview || item.campaign
            ? `/campaign/${item.id}`
            : `/preorders/${item.id}`
        }
      >
        <div className="main-campaign-card__image">
          {!item.image && (
            <span className="main-home__state">이미지 준비 중</span>
          )}
          {item.image && (
            <img
              className="main-campaign-card__photo"
              src={item.image}
              alt=""
              loading="lazy"
            />
          )}
          {item.preview && (
            <span
              className={`main-campaign-card__badge media-${item.media === '블로그' ? 'blog' : 'social'}`}
              aria-label={item.media}
            >
              {item.media === '블로그'
                ? 'N'
                : item.media === '인스타그램'
                  ? '◎'
                  : item.media === '클립'
                    ? '▷'
                    : '▶'}
            </span>
          )}
        </div>
        <h3>{item.title}</h3>
        <p className="main-campaign-card__description">
          {item.description || item.category}
        </p>
      </Link>
      {item.preview ? (
        <button
          className="main-campaign-card__favorite"
          type="button"
          aria-label={`${item.title} 미리보기 찜`}
          aria-pressed={saved}
          onClick={toggleSaved}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M5 3h14v19l-7-5-7 5z"
              fill={saved ? '#6b38db' : 'none'}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : item.campaign ? null : (
        <Link
          className="main-campaign-card__favorite"
          to="/favorites"
          aria-label="찜 목록 보기"
        >
          <img src="/assets/main-home/card-heart.svg" alt="" />
        </Link>
      )}
      <div className="main-campaign-card__meta">
        {item.daysLeft != null && (
          <strong>
            {item.recruitmentEnded || item.daysLeft < 0
              ? '모집 마감'
              : item.daysLeft === 0
                ? '오늘 마감'
                : `${item.daysLeft}일 남음`}
          </strong>
        )}
        {item.preview && (
          <span>
            신청 {item.applicants.toLocaleString()} <em>/ {item.capacity}명</em>
          </span>
        )}
      </div>
    </article>
  )
}
