/**
 * 캠페인 카드입니다. 홈·목록·특별 메뉴가 같은 카드를 씁니다.
 *
 * 구성(위에서 아래로)
 * - 정사각형 대표 이미지: 왼쪽 위 캠페인 종류 표시(제품·지역·기자단·구매평), 오른쪽 위 찜(하트) 버튼
 * - 브랜드 · 채널 아이콘(인스타그램·블로그·유튜브·클립)
 * - 캠페인 제목(두 줄까지), 제공 내역 한 줄
 * - 마감 안내와 '신청 N / M명', 모집 인원 대비 신청 비율 막대
 *
 * 카드 이동 링크와 찜 버튼을 나눠 링크 안에 버튼이 들어가지 않게 합니다.
 * 신청 인원은 서버가 집계한 값이 있을 때만 보여 주고, 마감 3일 이내는 '마감 임박'으로 강조합니다.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ChannelIcon from '../../features/discovery/ChannelIcon'
import FavoriteButton, {
  HeartIcon,
} from '../../features/discovery/FavoriteButton'

// 모집 종료 전이면서 마감까지 3일 이하로 남은 캠페인을 '마감 임박'으로 판단합니다.
function closingSoon(item) {
  return (
    !item.recruitmentEnded &&
    item.daysLeft != null &&
    item.daysLeft > 0 &&
    item.daysLeft <= 3
  )
}

// 마감 안내 문구입니다. 마감일 정보가 없으면 표시하지 않습니다.
function deadlineText(item) {
  if (item.daysLeft == null) return ''
  if (item.recruitmentEnded || item.daysLeft < 0) return '모집 마감'
  if (item.daysLeft === 0) return '오늘 마감'
  return closingSoon(item)
    ? `마감 임박 · ${item.daysLeft}일 남음`
    : `${item.daysLeft}일 남음`
}

// 상세 화면 주소입니다. 이전 프리오더 항목만 프리오더 상세로 보냅니다.
function detailPath(item) {
  return item.preview || item.campaign
    ? `/campaign/${item.id}`
    : `/preorders/${item.id}`
}

export default function CampaignCard({ item }) {
  // 이미지 주소가 실패해도 다른 사진으로 바꾸지 않고 '불러오지 못했습니다'를 보여 줍니다.
  const [failedImage, setFailedImage] = useState(null)
  const visibleImage = item.image && item.image !== failedImage
  const brand = item.source?.brandName || item.brandName || ''
  const reward =
    item.source?.rewardDescription || item.description || item.category
  const hasRecruitment = item.applicants != null && item.capacity > 0
  const ratio = hasRecruitment
    ? Math.min(100, Math.round((item.applicants / item.capacity) * 100))
    : 0
  const deadline = deadlineText(item)

  return (
    <article className="main-campaign-card">
      <Link className="main-campaign-card__content" to={detailPath(item)}>
        <div className="main-campaign-card__image">
          {visibleImage ? (
            <img
              className="main-campaign-card__photo"
              src={item.image}
              onError={() => setFailedImage(item.image)}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="main-campaign-card__placeholder">
              {item.image ? '이미지를 불러오지 못했습니다.' : '이미지 준비 중'}
            </span>
          )}
          {item.kind && (
            <span className="main-campaign-card__kind">{item.kind}</span>
          )}
        </div>
        <p className="main-campaign-card__brand">
          {brand && <span>{brand}</span>}
          {item.media && <ChannelIcon channel={item.media} size="sm" />}
        </p>
        <h3>{item.title}</h3>
        <p className="main-campaign-card__description">{reward}</p>
      </Link>

      {/* 찜 버튼은 링크 밖에 두고 이미지 오른쪽 위에 겹쳐 놓습니다. */}
      {item.preview || item.campaign ? (
        <FavoriteButton
          campaignId={item.id}
          title={item.title}
          preview={item.preview}
          className="main-campaign-card__favorite"
        />
      ) : (
        <Link
          className="main-campaign-card__favorite"
          to="/favorites"
          aria-label="찜 목록 보기"
        >
          <HeartIcon />
        </Link>
      )}

      {(deadline || hasRecruitment) && (
        <div className="main-campaign-card__meta">
          {deadline && (
            <strong className={closingSoon(item) ? 'is-closing' : undefined}>
              {deadline}
            </strong>
          )}
          {hasRecruitment && (
            <span>
              신청 {item.applicants.toLocaleString()} / {item.capacity}명
            </span>
          )}
        </div>
      )}
      {hasRecruitment && (
        <div className="main-campaign-card__progress" aria-hidden="true">
          <span style={{ width: `${ratio}%` }} />
        </div>
      )}
    </article>
  )
}
