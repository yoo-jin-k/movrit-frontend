/**
 * 참여자 홈 화면입니다.
 *
 * 구성(위에서 아래로)
 * 1. 상단 배너: 이번 주 모집 현황 · 소개 문구 · 둘러보기/신청 방법 버튼, 오른쪽에 '많이 신청한 캠페인' 2개씩 넘겨 보기
 * 2. 체험 방식 바로가기 4개(배송 체험·방문 체험·구매 후 리뷰·숏폼 영상)와 각 모집 수
 * 3. 캠페인 묶음: 모집 중(카테고리 버튼) · 마감이 가까운 · 선정 확률이 높은 · (개발 미리보기) 프리미어
 *
 * 목록·개수는 모두 공통 캠페인 조회 결과(useCampaignCatalog)에서 계산합니다(homeModel.js).
 * 실제 서버 모드에서는 서버가 집계한 신청 수가 있는 캠페인만 확률 계산에 씁니다.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import DiscoveryLayout from '../features/discovery/DiscoveryLayout'
import CampaignGrid from '../features/discovery/CampaignGrid'
import ChannelIcon from '../features/discovery/ChannelIcon'
import { useCampaignCatalog } from '../features/discovery/useCampaignCatalog'
import {
  HOME_CATEGORIES,
  HOME_SECTION_SIZE,
  categoryItems,
  closingItems,
  experienceCounts,
  featuredPages,
  highChanceItems,
  recruitingItems,
  weekLabel,
} from '../features/discovery/homeModel'

// 체험 방식 바로가기입니다. [제목, 설명, 개수 키, 이동 주소]
const EXPERIENCE_TILES = [
  ['배송 체험', '집에서 받아 써 보기', 'delivery', '/category/제품'],
  ['방문 체험', '매장·숙소 방문하기', 'visit', '/category/지역'],
  ['구매 후 리뷰', '구매하고 환급받기', 'purchase', '/special/shoppingreview'],
  ['숏폼 영상', '클립·릴스로 올리기', 'shortform', '/special/clip'],
]

// 배너 오른쪽의 가로형 캠페인 카드입니다.
function FeaturedCard({ item }) {
  const brand = item.source?.brandName || item.category
  const reward = item.source?.rewardDescription || item.description
  return (
    <Link className="home-hero__feature" to={`/campaign/${item.id}`}>
      <span className="home-hero__feature-image">
        {item.image && <img src={item.image} alt="" loading="lazy" />}
      </span>
      <span className="home-hero__feature-text">
        <small>
          {[brand, item.kind].filter(Boolean).join(' · ')}
          {item.media && (
            <ChannelIcon channel={item.media} size="sm" showLabel={false} />
          )}
        </small>
        <strong>{item.title}</strong>
        {reward && <span>{reward}</span>}
        {item.daysLeft != null && (
          <em>
            {item.daysLeft === 0 ? '오늘 마감' : `${item.daysLeft}일 남음`}
          </em>
        )}
      </span>
    </Link>
  )
}

// 상단 배너입니다. 오른쪽 추천 묶음은 ‹ › 버튼으로 넘깁니다.
function HomeHero({ items, loading }) {
  const pages = featuredPages(items)
  const [page, setPage] = useState(0)
  const current = pages[Math.min(page, Math.max(0, pages.length - 1))] || []
  const openCount = recruitingItems(items).length
  const move = (delta) =>
    setPage((value) => (value + delta + pages.length) % pages.length)
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__intro">
        <p className="home-hero__eyebrow">
          {weekLabel()}
          {!loading && ` · 모집 중 ${openCount}개`}
        </p>
        <h1 id="home-hero-title">
          이번 주엔 어떤 걸
          <br />써 보고 기록할까요?
        </h1>
        <p>
          제품 체험부터 매장 방문, 구매 후 리뷰까지.
          <br />
          조건과 일정을 확인하고 바로 신청하세요.
        </p>
        <div className="home-hero__actions">
          <Link className="home-button home-button--dark" to="/category/제품">
            캠페인 둘러보기
          </Link>
          <Link className="home-button" to="/community/guide">
            신청 방법 보기
          </Link>
        </div>
      </div>
      {current.length > 0 && (
        <div className="home-hero__featured" aria-label="많이 신청한 캠페인">
          <div className="home-hero__featured-head">
            <h2>많이 신청한 캠페인</h2>
            {pages.length > 1 && (
              <div className="home-hero__pager">
                <button
                  type="button"
                  aria-label="이전 추천"
                  onClick={() => move(-1)}
                >
                  ‹
                </button>
                <span aria-live="polite">
                  {page + 1} / {pages.length}
                </span>
                <button
                  type="button"
                  aria-label="다음 추천"
                  onClick={() => move(1)}
                >
                  ›
                </button>
              </div>
            )}
          </div>
          {current.map((item) => (
            <FeaturedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}

// 캠페인 묶음 하나(제목·설명·전체보기·카드 목록)입니다.
function HomeSection({ title, description, to, children }) {
  return (
    <section className="main-campaign-section">
      <div className="main-campaign-section__heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {to && <Link to={to}>전체보기 →</Link>}
      </div>
      {children}
    </section>
  )
}

export default function BuyerHomePage() {
  const { items, loading, error, previewMode } = useCampaignCatalog()
  const [category, setCategory] = useState('전체')
  const counts = experienceCounts(items)
  const closing = closingItems(items)
  const chance = highChanceItems(items, previewMode)
  // 오늘(한국 날짜) 모집이 끝나는 캠페인 수입니다. 실제 목록에서 셉니다.
  const closingToday = closing.filter((item) => item.daysLeft === 0).length
  // 묶음에 보일 캠페인이 없으면 묶음 자체를 숨깁니다(불러오는 중·오류일 때는 상태 안내를 보여 줍니다).
  const visible = (cards) => loading || error || cards.length > 0

  return (
    <DiscoveryLayout>
      <main className="discovery-width home-page">
        <HomeHero items={items} loading={loading} />

        <nav className="home-tiles" aria-label="체험 방식 바로가기">
          {EXPERIENCE_TILES.map(([title, description, key, to]) => (
            <Link key={key} to={to}>
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              {!loading && <em>{counts[key]}</em>}
            </Link>
          ))}
        </nav>

        <div className="home-page__sections">
          <HomeSection
            title="모집 중인 캠페인"
            description="관심 있는 분야를 골라 보세요"
          >
            <nav
              className="main-home-categories"
              aria-label="모집 중인 캠페인 카테고리"
            >
              {HOME_CATEGORIES.map((filter) => (
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
            <CampaignGrid
              items={categoryItems(items, category)}
              loading={loading}
              error={error}
            />
          </HomeSection>

          {visible(closing) && (
            <HomeSection
              title={
                <>
                  마감이 가까운 캠페인
                  {closingToday > 0 && (
                    <small className="main-home__today">
                      오늘 마감 {closingToday}개
                    </small>
                  )}
                </>
              }
              description="놓치기 전에 확인해 보세요"
              to="/category/제품?sort=closing"
            >
              <CampaignGrid items={closing} loading={loading} error={error} />
            </HomeSection>
          )}

          {visible(chance) && (
            <HomeSection
              title="선정 확률이 높은 캠페인"
              description="모집 인원에 비해 신청이 적은 캠페인이에요"
              to="/category/제품?sort=chance"
            >
              <CampaignGrid items={chance} loading={loading} error={error} />
            </HomeSection>
          )}

          {/* 프리미어 구분은 서버에 아직 없어 개발 미리보기에서만 보여 줍니다. */}
          {previewMode && (
            <HomeSection title="프리미어 캠페인" to="/category/프리미어">
              <CampaignGrid
                items={items
                  .filter((item) => item.premier)
                  .slice(0, HOME_SECTION_SIZE)}
              />
            </HomeSection>
          )}
        </div>
      </main>
    </DiscoveryLayout>
  )
}
