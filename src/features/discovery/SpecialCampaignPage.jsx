/**
 * 클립·구매평 구분에 맞춰 조회된 캠페인을 골라 표시합니다.
 * - 구매평: 캠페인 종류가 구매평(PURCHASE_REVIEW)인 캠페인
 * - 클립: 주요 콘텐츠 채널이 클립(CLIP)인 캠페인(별도 종류가 아니라 채널 기준)
 */
import { useParams } from 'react-router-dom'
import DiscoveryLayout from './DiscoveryLayout'
import CampaignGrid from './CampaignGrid'
import { useCampaignCatalog } from './useCampaignCatalog'

export default function SpecialCampaignPage() {
  const { kind } = useParams()
  const { items, loading, error, previewMode } = useCampaignCatalog()
  const clip = kind === 'clip'
  const title = clip ? '클립' : '구매평'
  const filtered = items.filter((item) =>
    clip ? item.media === '클립' : item.shoppingreview,
  )
  return (
    <DiscoveryLayout>
      <main className="discovery-width discovery-special">
        <section
          className={`discovery-special__banner ${clip ? 'is-clip' : ''}`}
          aria-label={`${title} 캠페인 소개`}
        >
          <img
            src={`/assets/discovery/banners/${clip ? 'clip' : 'review'}.png`}
            alt=""
          />
          <div className="discovery-special__copy">
            <h1>{title} 캠페인이란?</h1>
            <p>
              {clip
                ? '체험한 순간을 짧은 영상으로 기록하고'
                : '직접 경험한 제품과 서비스를 살펴보고'}
              <br />
              나만의 이야기를 MOVRIT에서 나누어보세요.
            </p>
          </div>
        </section>
        <section className="main-campaign-section">
          <div className="main-campaign-section__heading">
            <h2>{title} 캠페인 신청하기</h2>
          </div>
          {!previewMode && !clip && (
            <p className="discovery-info">
              구매처에서 직접 구매하고 구매평을 남기면, 구매평 승인 후 브랜드가
              약속한 금액을 돌려드립니다.
            </p>
          )}
          {!previewMode && clip && (
            <p className="discovery-info">
              네이버 클립 등 짧은 영상으로 콘텐츠를 올리는 캠페인입니다.
            </p>
          )}
          <CampaignGrid items={filtered} loading={loading} error={error} />
        </section>
        <section className="main-campaign-section">
          <div className="main-campaign-section__heading">
            <h2>콘텐츠 감상하기</h2>
          </div>
          <p>인플루언서들의 콘텐츠로 새로운 취향을 발견해 보세요.</p>
          <div className="main-home__state">등록된 콘텐츠를 준비 중입니다.</div>
        </section>
      </main>
    </DiscoveryLayout>
  )
}
