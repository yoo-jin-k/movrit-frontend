/**
 * 공통 캠페인 조회 훅의 항목을 카테고리별로 걸러 홈 섹션에 배치합니다.
 * '마감 임박'과 '선정 확률 높은' 큐레이션 섹션을 제공합니다.
 * 실제 서버 모드에서는 서버가 집계한 신청 수가 있는 캠페인만 확률 계산에 사용하고,
 * 프리미어처럼 서버에 구분 정보가 없는 섹션은 previewMode에서만 구성합니다.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import DiscoveryLayout from '../features/discovery/DiscoveryLayout'
import BannerCarousel from '../features/discovery/BannerCarousel'
import CampaignGrid from '../features/discovery/CampaignGrid'
import { SHORTCUTS } from '../features/discovery/catalog'
import { useCampaignCatalog } from '../features/discovery/useCampaignCatalog'

export default function BuyerHomePage() {
  const { items, loading, error, previewMode } = useCampaignCatalog()
  const [category, setCategory] = useState('전체')
  const popular = items
    .filter(
      (item) =>
        category === '전체' ||
        item.category === category ||
        (category === '육아' && item.category === '유아동'),
    )
    .slice(0, 10)
  // 모집이 끝나지 않은 캠페인을 마감일이 가까운 순서로 정렬합니다.
  const closing = [...items]
    .filter(
      (item) =>
        item.daysLeft != null && item.daysLeft >= 0 && !item.recruitmentEnded,
    )
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 10)
  // 모집 인원 대비 신청 수(경쟁률)가 낮을수록 선정 확률이 높다고 보고 오름차순으로 정렬합니다.
  // 신청 수 또는 모집 인원이 없는 캠페인은 계산할 수 없으므로 제외합니다.
  const chance = items
    .filter(
      (item) =>
        item.applicants != null &&
        item.capacity > 0 &&
        !item.recruitmentEnded &&
        (previewMode || !item.preview),
    )
    .sort((a, b) => a.applicants / a.capacity - b.applicants / b.capacity)
    .slice(0, 10)
  // 오늘(한국 날짜) 모집이 끝나는 캠페인 수입니다. 실제 목록에서 셉니다(고정값이 아닙니다).
  const closingToday = items.filter(
    (item) => item.daysLeft === 0 && !item.recruitmentEnded,
  ).length
  const sections = [
    [
      <>
        신청 <em>마감임박</em> 캠페인
        {closingToday > 0 && (
          <small className="main-home__today">
            {' '}
            · 오늘 마감 {closingToday}개
          </small>
        )}
      </>,
      closing,
      '/category/제품?sort=closing',
    ],
    [
      <>
        <em>선정확률 높은</em> 캠페인
      </>,
      chance,
      '/category/제품?sort=chance',
    ],
    ...(previewMode
      ? [
          [
            <>
              <em>프리미어</em> 캠페인
            </>,
            items.filter((item) => item.premier).slice(0, 10),
            '/category/프리미어',
          ],
        ]
      : []),
  ].filter(([, cards]) => loading || error || cards.length > 0)
  return (
    <DiscoveryLayout>
      <main>
        <BannerCarousel />
        <nav
          className="discovery-width discovery-shortcuts"
          aria-label="캠페인 바로가기"
        >
          {SHORTCUTS.map(([label, icon, to]) => (
            <Link key={label} to={to}>
              <span aria-hidden="true">
                <img src={`/assets/discovery/icons/${icon}.svg`} alt="" />
              </span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="discovery-width main-home__sections">
          <section className="main-campaign-section">
            <div className="main-campaign-section__heading">
              <h2>
                {previewMode ? (
                  <>
                    지금 <em>신청 급상승🔥</em> 중인 캠페인
                  </>
                ) : (
                  '모집 중인 캠페인'
                )}
              </h2>
            </div>
            <nav
              className="main-home-categories"
              aria-label="인기 캠페인 카테고리"
            >
              {['전체', '맛집', '뷰티', '육아', '식품'].map((filter) => (
                <button
                  type="button"
                  key={filter}
                  aria-pressed={category === filter}
                  onClick={() => setCategory(filter)}
                >
                  {filter}
                </button>
              ))}
            </nav>
            <CampaignGrid items={popular} loading={loading} error={error} />
          </section>
          <Link className="discovery-promo" to="/community/guide">
            <span>새로운 기회를 놓치지 마세요</span>
            <strong>MOVRIT 소식과 캠페인 참여 가이드</strong>
            <b>확인하기 →</b>
          </Link>
          {sections.map(([title, cards, to], i) => (
            <section className="main-campaign-section" key={to}>
              <div className="main-campaign-section__heading">
                <h2>{title}</h2>
                <Link to={to}>전체보기 →</Link>
              </div>
              <CampaignGrid items={cards} loading={loading} error={error} />
              {i === 1 && (
                <Link
                  to="/support"
                  className="discovery-promo discovery-promo--purple"
                >
                  <span>브랜드의 이야기를 들려주세요</span>
                  <strong>광고주이신가요?</strong>
                  <b>캠페인 문의하기 →</b>
                </Link>
              )}
            </section>
          ))}
        </div>
      </main>
    </DiscoveryLayout>
  )
}
