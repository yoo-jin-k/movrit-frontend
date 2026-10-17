import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  collaborationAction,
  getMyCollaborations,
  getMyPerformance,
  getOpenCampaigns,
} from '../api/collaborationApi'
export default function CreatorCollaborationPage() {
  const [campaigns, setCampaigns] = useState([])
  const [items, setItems] = useState([])
  const [performance, setPerformance] = useState([])
  const load = () =>
    Promise.all([
      getOpenCampaigns(),
      getMyCollaborations(),
      getMyPerformance(),
    ]).then(([a, b, c]) => {
      setCampaigns(a)
      setItems(b)
      setPerformance(c)
    })
  useEffect(() => {
    Promise.all([getOpenCampaigns(), getMyCollaborations(), getMyPerformance()])
      .then(([a, b, c]) => {
        setCampaigns(a)
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
      <h1>내 협업</h1>
      <h2>모집 중 프로젝트</h2>
      {campaigns.map((c) => (
        <section key={c.id}>
          <h3>{c.title}</h3>
          <p>
            {c.brandName} / {c.preorderTitle}
          </p>
          <p>{c.description}</p>
          <p>모집 {c.recruitmentCount}명</p>
          <Link to={`/campaign/${c.id}`}>참여 조건 확인 및 신청</Link>
          <hr />
        </section>
      ))}
      <h2>내 협업</h2>
      {items.map((v) => (
        <section key={v.id}>
          <b>{v.preorderTitle}</b> · {v.type} · {v.status}
          <p>{v.message}</p>
          {v.type === 'PROPOSAL' && v.status === 'PENDING' && (
            <>
              <button
                onClick={() =>
                  action(() => collaborationAction(v.id, 'accept'))
                }
              >
                수락
              </button>
              <button
                onClick={() =>
                  action(() => collaborationAction(v.id, 'decline'))
                }
              >
                거절
              </button>
            </>
          )}
          {v.referralUrl && (
            <p>
              추천 링크: <code>{location.origin + v.referralUrl}</code>
            </p>
          )}
          <hr />
        </section>
      ))}
      <h2>성과</h2>
      {performance.map((p) => (
        <p key={p.collaborationId}>
          {p.preorderTitle}: 클릭 {p.clicks} / 결제주문 {p.paidOrders} / GMV{' '}
          {Number(p.gmv).toLocaleString()}원 / 전환율{' '}
          {p.conversionRate.toFixed(1)}%
        </p>
      ))}
    </main>
  )
}
