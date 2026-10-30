/**
 * 실제 캠페인·프리오더와 미리보기 항목의 상세 경로를 구분합니다.
 * 미리보기 찜은 세션 상태만 바꾸고, 실제 캠페인 찜은 서버에 저장한 뒤에만 표시합니다(가짜 성공 표시 없음).
 * 로그인하지 않은 사용자가 실제 캠페인을 찜하면 로그인 화면으로 안내합니다.
 * 신청 인원은 서버가 집계한 값이 있을 때만 "신청 N / 모집 M명"으로 표시하고,
 * 마감 3일 이내 캠페인은 '마감 임박'으로 강조합니다.
 */
import { usePreviewFavorite } from '../../features/discovery/usePreviewFavorite'
import {
  toggleCampaignFavorite,
  useCampaignFavorite,
} from '../../features/discovery/campaignFavoriteStore'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

// 모집 종료 전이면서 마감까지 3일 이하로 남은 캠페인을 '마감 임박'으로 판단합니다.
function closingSoon(item) {
  return (
    !item.recruitmentEnded &&
    item.daysLeft != null &&
    item.daysLeft > 0 &&
    item.daysLeft <= 3
  )
}

// 찜 버튼 아이콘입니다. 미리보기·실제 캠페인 카드가 같은 모양을 씁니다.
function FavoriteIcon({ saved }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 3h14v19l-7-5-7 5z"
        fill={saved ? '#6b38db' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// 실제 캠페인 찜 버튼입니다. 서버 저장이 실패하면 상태를 바꾸지 않고 짧게 안내합니다.
function LiveFavoriteButton({ item }) {
  const navigate = useNavigate()
  const { loggedIn, saved, busy } = useCampaignFavorite(item.id)
  const [failed, setFailed] = useState(false)
  const toggle = async () => {
    if (!loggedIn) {
      navigate('/login')
      return
    }
    setFailed(false)
    try {
      await toggleCampaignFavorite(item.id)
    } catch {
      setFailed(true)
    }
  }
  return (
    <button
      className="main-campaign-card__favorite"
      type="button"
      aria-label={
        failed
          ? `${item.title} 찜 저장 실패, 다시 시도`
          : `${item.title} ${saved ? '찜 해제' : '찜하기'}`
      }
      title={failed ? '찜 저장에 실패했습니다. 다시 눌러 주세요.' : undefined}
      aria-pressed={saved}
      disabled={busy}
      onClick={toggle}
    >
      <FavoriteIcon saved={saved} />
    </button>
  )
}

// 카드 이동과 찜 버튼을 분리하여 중첩 링크와 상태 불일치를 방지합니다.
export default function CampaignCard({ item }) {
  // 실제 URL이 실패해도 다른 상품 사진으로 대체하지 않고 상태를 안내합니다.
  const [failedImage, setFailedImage] = useState(null)
  const visibleImage = item.image && item.image !== failedImage
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
          {!visibleImage && (
            <span className="main-home__state">
              {item.image ? '이미지를 불러오지 못했습니다.' : '이미지 준비 중'}
            </span>
          )}
          {visibleImage && (
            <img
              className="main-campaign-card__photo"
              src={item.image}
              onError={() => setFailedImage(item.image)}
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
          <FavoriteIcon saved={saved} />
        </button>
      ) : item.campaign ? (
        <LiveFavoriteButton item={item} />
      ) : (
        <Link
          className="main-campaign-card__favorite"
          to="/favorites/preorders"
          aria-label="찜 목록 보기"
        >
          <img src="/assets/main-home/card-heart.svg" alt="" />
        </Link>
      )}
      <div className="main-campaign-card__meta">
        {item.daysLeft != null && (
          <strong className={closingSoon(item) ? 'is-closing' : undefined}>
            {item.recruitmentEnded || item.daysLeft < 0
              ? '모집 마감'
              : item.daysLeft === 0
                ? '오늘 마감'
                : closingSoon(item)
                  ? `마감 임박 · ${item.daysLeft}일`
                  : `${item.daysLeft}일 남음`}
          </strong>
        )}
        {item.applicants != null && item.capacity != null && (
          <span>
            신청 {item.applicants.toLocaleString()} <em>/ {item.capacity}명</em>
          </span>
        )}
      </div>
    </article>
  )
}
