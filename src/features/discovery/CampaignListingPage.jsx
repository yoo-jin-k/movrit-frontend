import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import DiscoveryLayout from './DiscoveryLayout'
import CampaignGrid from './CampaignGrid'
import { LOCAL_CATEGORIES, MEDIA, PRODUCT_CATEGORIES, REGIONS } from './catalog'
import { useCampaignCatalog } from './useCampaignCatalog'

export default function CampaignListingPage({ search = false }) {
  const { section = '제품' } = useParams()
  const [params, setParams] = useSearchParams()
  const [regionOpen, setRegionOpen] = useState(false)
  const { items, loading, error, previewMode } = useCampaignCatalog()
  const category = params.get('category') || '전체'
  const media = params.get('media') || '미디어 전체'
  const region = params.get('region') || '전국'
  const sort = params.get('sort') || 'latest'
  const page = Math.max(1, Number(params.get('page')) || 1)
  const query = (params.get('q') || '').toLocaleLowerCase()
  const update = (key, value) => {
    const next = new URLSearchParams(params)
    next.set(key, value)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }
  const valid = ['제품', '지역', '기자단', '오늘오픈', '프리미어'].includes(section)
  const categories =
    section === '제품'
      ? PRODUCT_CATEGORIES
      : section === '지역'
        ? LOCAL_CATEGORIES
        : section === '프리미어'
          ? ['전체', '블로그 프리미어', '인스타그램 프리미어', '네이버 인플루언서']
          : []
  const unsupported = !previewMode && !search && section !== '제품'
  const filtered = items
    .filter((item) => {
      if (unsupported) return false
      if (!previewMode)
        return (
          (!search || item.title.toLocaleLowerCase().includes(query)) &&
          (category === '전체' || item.category === category)
        )
      if (search) return item.title.toLocaleLowerCase().includes(query)
      if (section === '오늘오픈' && !item.today) return false
      if (section === '프리미어' && !item.premier) return false
      if (['제품', '지역', '기자단'].includes(section) && item.kind !== section) return false
      if (
        category !== '전체' &&
        section !== '프리미어' &&
        (section === '지역' ? item.localCategory : item.category) !== category
      )
        return false
      if (
        section === '프리미어' &&
        category !== '전체' &&
        item.media !== (category === '인스타그램 프리미어' ? '인스타그램' : '블로그')
      )
        return false
      return (
        (media === '미디어 전체' || item.media === media) &&
        (region === '전국' || item.region === region)
      )
    })
    .sort((a, b) =>
      sort === 'closing'
        ? (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity)
        : sort === 'popular'
          ? (b.applicants || 0) - (a.applicants || 0)
          : sort === 'chance'
            ? (a.applicants / a.capacity || Infinity) - (b.applicants / b.capacity || Infinity)
            : 0,
    )
  const pages = Math.max(1, Math.ceil(filtered.length / 20))
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
                  : !previewMode && section === '제품'
                    ? '모집 중인 캠페인'
                    : `${section} 캠페인`}
              </h1>
              {section === '지역' && !search && previewMode && (
                <div className="discovery-region">
                  <button
                    type="button"
                    aria-expanded={regionOpen}
                    onClick={() => setRegionOpen(!regionOpen)}
                  >
                    ⌖ {region} ⌄
                  </button>
                  {regionOpen && (
                    <div className="discovery-region__options" aria-label="지역 선택">
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
            {!search && categories.length > 0 && (
              <nav className="discovery-filter-chips" aria-label="세부 카테고리">
                {categories.map((name) => (
                  <button
                    type="button"
                    key={name}
                    aria-pressed={category === name}
                    onClick={() => update('category', name)}
                  >
                    {name === '전체' ? 'ⓐ ' : ''}
                    {name}
                  </button>
                ))}
                {section === '프리미어' && (
                  <Link to="/community/guide" className="discovery-premier-link">
                    더 많은 프리미어 자격을 원한다면?
                  </Link>
                )}
              </nav>
            )}
            <div className="discovery-filter-bar">
              {section !== '프리미어' && !search && previewMode && (
                <div className="discovery-media" aria-label="미디어 선택">
                  {MEDIA.map((name) => (
                    <button
                      type="button"
                      key={name}
                      aria-pressed={media === name}
                      onClick={() => update('media', name)}
                    >
                      <span aria-hidden="true">✓</span>
                      {name}
                    </button>
                  ))}
                </div>
              )}
              {search && <span>캠페인 {filtered.length}개</span>}
              <select
                aria-label="캠페인 정렬"
                disabled={!previewMode}
                value={previewMode ? sort : 'server'}
                onChange={(event) => update('sort', event.target.value)}
              >
                {!previewMode && <option value="server">서버 제공 순서</option>}
                <option value="latest">최신순 ↓</option>
                <option value="popular">인기순</option>
                <option value="closing">마감임박순</option>
                <option value="chance">선정확률순</option>
              </select>
            </div>
            {!previewMode && (
              <p className="discovery-info">
                {unsupported
                  ? '이 메뉴의 캠페인 구분 정보는 아직 서버에서 제공하지 않습니다.'
                  : '공개 모집 목록을 조회합니다. 종류·지역·채널·인기 정렬은 연동 준비 중이며 최신순과 일치한다고 보장하지 않습니다.'}
              </p>
            )}
            <CampaignGrid
              items={filtered.slice((currentPage - 1) * 20, currentPage * 20)}
              loading={loading}
              error={error}
            />
            {!loading && filtered.length > 0 && (
              <nav className="discovery-pagination" aria-label="페이지 이동">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => update('page', String(currentPage - 1))}
                >
                  ‹
                </button>
                {Array.from({ length: pages }, (_, index) => (
                  <button
                    type="button"
                    key={index}
                    aria-current={currentPage === index + 1 ? 'page' : undefined}
                    onClick={() => update('page', String(index + 1))}
                  >
                    {index + 1}
                  </button>
                ))}
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
