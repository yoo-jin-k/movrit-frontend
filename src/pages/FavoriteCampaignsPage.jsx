/**
 * 내가 찜한 캠페인 목록 화면입니다.
 *
 * - 서버의 찜 목록을 불러와 탐색 화면과 같은 캠페인 카드로 보여줍니다.
 * - 카드에서 찜을 해제하면(서버 성공 후) 목록에서도 바로 사라집니다.
 * - 모집이 끝난 캠페인도 찜 목록에는 남아 있으며 카드에 '모집 마감'으로 표시됩니다.
 * - 빈 목록과 조회 오류를 구분해 안내합니다.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFavoriteCampaigns } from '../api/campaignFavoriteApi'
import BuyerLayout from '../components/buyer/BuyerLayout'
import CampaignGrid from '../features/discovery/CampaignGrid'
import { adaptCampaignSummary } from '../features/discovery/campaignReadAdapter'
import { useFavoriteCampaignIds } from '../features/discovery/campaignFavoriteStore'

export default function FavoriteCampaignsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const favoriteIds = useFavoriteCampaignIds()

  // 화면에 들어올 때 한 번 찜 목록을 불러와 카드 모델로 바꿉니다.
  useEffect(() => {
    let active = true
    getFavoriteCampaigns()
      .then((data) => {
        if (!active) return
        if (!Array.isArray(data)) throw new Error('응답 형식 오류')
        setItems(data.map((entry) => adaptCampaignSummary(entry.campaign)))
        setError('')
      })
      .catch(() => {
        if (active) setError('찜한 캠페인을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // 찜 ID를 아직 불러오지 못했으면(빈 집합) 서버 목록을 그대로 보여주고, 불러온 뒤에는 해제한 항목을 숨깁니다.
  const visible = favoriteIds.size
    ? items.filter((item) => favoriteIds.has(item.id))
    : items

  return (
    <BuyerLayout title="찜한 캠페인">
      {!loading && !error && !visible.length ? (
        <div className="main-home__state" role="status">
          아직 찜한 캠페인이 없습니다.
          <Link to="/home">캠페인 둘러보기</Link>
        </div>
      ) : (
        <CampaignGrid items={visible} loading={loading} error={error} />
      )}
    </BuyerLayout>
  )
}
