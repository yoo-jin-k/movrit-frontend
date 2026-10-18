/**
 * 공통 캠페인 조회 훅의 항목을 카테고리별로 걸러 홈 섹션에 배치합니다.
 * 선정 확률 등 예시 지표 기반 섹션은 previewMode에서만 구성합니다.
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
  const closing = [...items]
    .filter((item) => item.daysLeft != null)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 10)
  const sections = previewMode
    ? [
        [
          <>
            신청 <em>마감임박</em> 캠페인
          </>,
          closing,
          '/category/제품?sort=closing',
        ],
        [
          <>
            <em>선정확률 높은</em> 캠페인
          </>,
          items
            .filter((item) => item.preview)
            .sort(
              (a, b) => a.applicants / a.capacity - b.applicants / b.capacity,
            )
            .slice(0, 10),
          '/category/제품?sort=chance',
        ],
        [
          <>
            <em>프리미어</em> 캠페인
          </>,
          items.filter((item) => item.premier).slice(0, 10),
          '/category/프리미어',
        ],
      ]
    : []
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
