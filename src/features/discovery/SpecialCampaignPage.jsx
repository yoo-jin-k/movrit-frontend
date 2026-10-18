/**
 * 클립·구매평 구분에 맞춰 조회된 캠페인을 골라 표시합니다.
 * 예시 모드와 실제 데이터의 지원 범위를 구분하여 화면을 구성합니다.
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
          {!previewMode && (
            <p className="discovery-info">
              이 메뉴의 유형 구분 정보는 아직 서버에서 제공하지 않습니다.
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
