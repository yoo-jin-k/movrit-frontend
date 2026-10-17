import { liveCampaignMediaApi } from '../api/liveCampaignMediaApi'
import { useEffect, useState } from 'react'
import {
  collaborationAction,
  getCreators,
  getSellerCollaborations,
  getSellerPerformance,
  propose,
} from '../api/collaborationApi'
import SellerCampaignManager from '../features/sellerCampaigns/SellerCampaignManager'
export default function SellerCollaborationPage() {
  const [creators, setCreators] = useState([]),
    [items, setItems] = useState([]),
    [performance, setPerformance] = useState([])
  const load = () =>
    Promise.all([
      getCreators(),
      getSellerCollaborations(),
      getSellerPerformance(),
    ]).then(([a, b, c]) => {
      setCreators(a)
      setItems(b)
      setPerformance(c)
    })
  useEffect(() => {
    Promise.all([
      getCreators(),
      getSellerCollaborations(),
      getSellerPerformance(),
    ])
      .then(([a, b, c]) => {
        setCreators(a)
        setItems(b)
        setPerformance(c)
      })
      .catch(() => alert('협업 정보를 불러오지 못했습니다.'))
  }, [])
  const action = async (job) => {
    try {
      await job()
      await load()
    } catch (e) {
      alert(e.response?.data?.message || '처리에 실패했습니다.')
    }
  }
  return (
    <main>
      <h1>브랜드 캠페인·협업 관리</h1>
      <SellerCampaignManager mediaApi={liveCampaignMediaApi} />
      <h2>인플루언서 직접 제안</h2>
      {creators.map((c) => (
        <section key={c.id}>
          <b>{c.nickname}</b> · {c.primaryCategory} · 팔로워{' '}
          {c.followerCount.toLocaleString()}명{' '}
          <button
            onClick={() => {
              const preorderId = prompt('제안할 프리오더 ID를 입력해 주세요.')
              const message =
                preorderId && prompt('제안 메시지를 입력해 주세요.')
              if (message)
                action(() =>
                  propose({
                    preorderId: Number(preorderId),
                    creatorId: c.id,
                    message,
                  }),
                )
            }}
          >
            제안
          </button>
        </section>
      ))}
      <h2>지원·제안 현황</h2>
      {items.map((v) => (
        <section key={v.id}>
          <b>{v.preorderTitle}</b> / {v.creatorNickname} / {v.type} / {v.status}
          {v.type === 'APPLICATION' && v.status === 'PENDING' && (
            <>
              <button
                onClick={() =>
                  action(() => collaborationAction(v.id, 'approve'))
                }
              >
                승인
              </button>
              <button
                onClick={() =>
                  action(() => collaborationAction(v.id, 'reject'))
                }
              >
                거절
              </button>
            </>
          )}{' '}
          {v.status === 'ACTIVE' && (
            <button
              onClick={() => action(() => collaborationAction(v.id, 'end'))}
            >
              협업 종료
            </button>
          )}
          <hr />
        </section>
      ))}
      <h2>인플루언서별 성과</h2>
      {performance.map((p) => (
        <p key={p.collaborationId}>
          {p.creatorNickname} / {p.preorderTitle}: 클릭 {p.clicks}, 주문{' '}
          {p.paidOrders}, GMV {Number(p.gmv).toLocaleString()}원, 전환율{' '}
          {p.conversionRate.toFixed(1)}%
        </p>
      ))}
    </main>
  )
}
