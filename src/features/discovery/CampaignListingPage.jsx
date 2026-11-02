/**
 * 캠페인 목록 화면입니다(제품·지역·기자단·오늘오픈·프리미어, 검색 결과).
 *
 * 화면 구성: 제목(+지역 선택) → 조건 상자(카테고리·채널) → 개수·정렬 → 카드 4열 → 페이지 이동
 * URL 쿼리를 카테고리·미디어·지역·정렬·페이지 상태로 사용합니다.
 * 실제 데이터는 서버 검색(/api/collaborations/campaigns/search)이 조건·정렬·페이지를 적용하고,
 * 개발 미리보기만 예시 데이터에 같은 조건을 화면에서 적용합니다(campaignSearchModel).
 */
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import DiscoveryLayout from './DiscoveryLayout'
import ChannelIcon from './ChannelIcon'
import CampaignGrid from './CampaignGrid'
import { LOCAL_CATEGORIES, MEDIA, PRODUCT_CATEGORIES, REGIONS } from './catalog'
import { useCampaignSearch } from './useCampaignCatalog'
import { LISTING_SECTIONS, pageNumbers } from './campaignSearchModel'

export default function CampaignListingPage({ search = false }) {
  const { section = '제품' } = useParams()
  const [params, setParams] = useSearchParams()
  const [regionOpen, setRegionOpen] = useState(false)
  const category = params.get('category') || '전체'
  const media = params.get('media') || '미디어 전체'
  const region = params.get('region') || '전국'
  const sort = params.get('sort') || 'latest'
  const page = Math.max(1, Number(params.get('page')) || 1)
  const query = params.get('q') || ''
  // 필터를 바꾸면 페이지를 초기화하여 이전 페이지 번호 때문에 결과가 비어 보이지 않게 합니다.
  const update = (key, value) => {
    const next = new URLSearchParams(params)
    next.set(key, value)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }
  const valid = LISTING_SECTIONS.includes(section)
  const { items, total, totalPages, loading, error } = useCampaignSearch({
    search,
    section,
    category,
    media,
    region,
    sort,
    page,
    query,
  })
  const categories =
    section === '제품'
      ? PRODUCT_CATEGORIES
      : section === '지역'
        ? LOCAL_CATEGORIES
        : section === '프리미어'
          ? [
              '전체',
              '블로그 프리미어',
              '인스타그램 프리미어',
              '네이버 인플루언서',
            ]
          : []
  const pages = Math.max(1, totalPages)
  const currentPage = Math.min(page, pages)
  return (
    <DiscoveryLayout>
      <main className="discovery-width discovery-listing">
        {!valid && !search ? (
          <div className="main-home__state">
            <h1>메뉴를 찾을 수 없습니다.</h1>
            <Link to="/home">메인으로 돌아가기</Link>
          </div>
        ) : (
          <>
            <div className="discovery-listing__title">
              <h1>
                {search
                  ? `‘${params.get('q') || ''}’ 검색 결과`
                  : `${section} 캠페인`}
              </h1>
              {section === '지역' && !search && (
                <div className="discovery-region">
                  <button
                    type="button"
                    aria-expanded={regionOpen}
                    onClick={() => setRegionOpen(!regionOpen)}
                  >
                    {region} ▾
                  </button>
                  {regionOpen && (
                    <div
                      className="discovery-region__options"
                      aria-label="지역 선택"
                    >
                      {REGIONS.map((name) => (
                        <button
                          type="button"
                          key={name}
                          aria-pressed={region === name}
                          onClick={() => {
                            update('region', name)
                            setRegionOpen(false)
                          }}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* 조건 상자: 카테고리와 콘텐츠 채널을 한곳에서 고릅니다. */}
            {!search && (categories.length > 0 || section !== '프리미어') && (
              <section
                className="discovery-filter-panel"
                aria-label="캠페인 조건"
              >
                {categories.length > 0 && (
                  <div className="discovery-filter-panel__row">
                    <h2>카테고리</h2>
                    <nav
                      className="discovery-filter-chips"
                      aria-label="세부 카테고리"
                    >
                      {categories.map((name) => (
                        <button
                          type="button"
                          key={name}
                          aria-pressed={category === name}
                          onClick={() => update('category', name)}
                        >
                          {name}
                        </button>
                      ))}
                    </nav>
                  </div>
                )}
                {section !== '프리미어' && (
                  <div className="discovery-filter-panel__row">
                    <h2>채널</h2>
                    <div className="discovery-media" aria-label="미디어 선택">
                      {MEDIA.map((name) => (
                        <button
                          type="button"
                          key={name}
                          aria-pressed={media === name}
                          onClick={() => update('media', name)}
                        >
                          {name === '미디어 전체' ? (
                            '전체'
                          ) : (
                            <ChannelIcon channel={name} size="sm" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {section === '프리미어' && (
                  <Link
                    to="/community/guide"
                    className="discovery-premier-link"
                  >
                    더 많은 프리미어 자격을 원한다면?
                  </Link>
                )}
              </section>
            )}
            {/* 개수와 정렬 */}
            <div className="discovery-filter-bar">
              {!loading && !error && <span>캠페인 {total}개</span>}
              <select
                aria-label="캠페인 정렬"
                value={sort}
                onChange={(event) => update('sort', event.target.value)}
              >
                <option value="latest">최신순</option>
                <option value="popular">인기순</option>
                <option value="closing">마감임박순</option>
                <option value="chance">선정확률순</option>
              </select>
            </div>
            <CampaignGrid items={items} loading={loading} error={error} />
            {!loading && total > 0 && items.length === 0 && (
              <p className="main-home__state">
                페이지를 찾을 수 없습니다.{' '}
                <button type="button" onClick={() => update('page', '1')}>
                  첫 페이지로
                </button>
              </p>
            )}
            {!loading && total > 0 && pages > 1 && (
              <nav className="discovery-pagination" aria-label="페이지 이동">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => update('page', String(currentPage - 1))}
                >
                  ‹
                </button>
                {pageNumbers(currentPage, pages).map((number, index) =>
                  number === '…' ? (
                    <span key={`gap-${index}`} aria-hidden="true">
                      …
                    </span>
                  ) : (
                    <button
                      type="button"
                      key={number}
                      aria-current={currentPage === number ? 'page' : undefined}
                      onClick={() => update('page', String(number))}
                    >
                      {number}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={currentPage === pages}
                  onClick={() => update('page', String(currentPage + 1))}
                >
                  ›
                </button>
              </nav>
            )}
          </>
        )}
      </main>
    </DiscoveryLayout>
  )
}
