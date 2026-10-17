import CampaignCard from '../../components/buyer/CampaignCard'
export default function CampaignGrid({ items, loading, error }) {
  if (loading)
    return (
      <div className="main-home__state" role="status">
        <span className="discovery-spinner" />
        캠페인을 불러오는 중입니다.
      </div>
    )
  if (error)
    return (
      <div className="main-home__state" role="alert">
        {error}
        <button type="button" onClick={() => window.location.reload()}>
          다시 시도
        </button>
      </div>
    )
  if (!items.length)
    return (
      <div className="main-home__state" role="status">
        조건에 맞는 캠페인이 없습니다.
      </div>
    )
  return (
    <div className="main-campaign-grid">
      {items.map((item) => (
        <CampaignCard key={item.id} item={item} />
      ))}
    </div>
  )
}
