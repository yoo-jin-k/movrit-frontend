import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getCreatorDashboard,
  updateCreatorCampaignStatus,
} from '../api/creatorApi'
import './CreatorPage.css'

const formatMoney = (value) => Number(value || 0).toLocaleString('ko-KR')

function CreatorDashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = async () => {
    try {
      const { data } = await getCreatorDashboard()
      setDashboard(data)
      setError('')
    } catch (err) {
      if (err.response?.status === 404) {
        setError(
          '아직 공동구매 활동 내역이 없습니다. 일반 캠페인은 별도 인플루언서 등록 없이 참여할 수 있습니다.',
        )
      } else {
        setError('대시보드 정보를 불러오지 못했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getCreatorDashboard()
      .then(({ data }) => {
        setDashboard(data)
        setError('')
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setError(
            '아직 공동구매 활동 내역이 없습니다. 일반 캠페인은 별도 인플루언서 등록 없이 참여할 수 있습니다.',
          )
        } else {
          setError('대시보드 정보를 불러오지 못했습니다.')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const respondToProposal = async (campaignId, status) => {
    try {
      await updateCreatorCampaignStatus(campaignId, status)
      await loadDashboard()
    } catch (err) {
      setError(
        err.response?.data?.message || '캠페인 상태 변경에 실패했습니다.',
      )
    }
  }

  if (loading) {
    return (
      <main className="creator-page">
        <p>대시보드 불러오는 중...</p>
      </main>
    )
  }

  if (!dashboard) {
    return (
      <main className="creator-page">
        <section className="creator-panel creator-empty">
          <h1>공동구매 활동 내역</h1>
          <p>{error}</p>
          <Link
            className="creator-primary-button creator-link-button"
            to="/home"
          >
            캠페인 둘러보기
          </Link>
        </section>
      </main>
    )
  }

  const { profile, campaigns } = dashboard

  return (
    <main className="creator-page creator-dashboard">
      <header className="creator-dashboard-header">
        <div>
          <span className="creator-eyebrow">CREATOR DASHBOARD</span>
          <h1>{profile.nickname}님의 대시보드</h1>
          <p>
            {profile.channelPlatform} · {profile.channelHandle}
          </p>
        </div>
        <span
          className={`creator-status creator-status-${profile.status.toLowerCase()}`}
        >
          {profile.status}
        </span>
      </header>

      {profile.status === 'REJECTED' && (
        <div className="creator-alert">
          반려 사유: {profile.rejectionReason || '관리자에게 문의해 주세요.'}
        </div>
      )}

      <section className="creator-stats-grid">
        <article>
          <span>제안 대기</span>
          <strong>{dashboard.proposedCampaigns}</strong>
        </article>
        <article>
          <span>진행 캠페인</span>
          <strong>{dashboard.activeCampaigns}</strong>
        </article>
        <article>
          <span>완료 캠페인</span>
          <strong>{dashboard.completedCampaigns}</strong>
        </article>
        <article>
          <span>누적 주문</span>
          <strong>{dashboard.totalOrders.toLocaleString('ko-KR')}</strong>
        </article>
      </section>

      <section className="creator-earnings-grid">
        <article className="creator-panel">
          <span>공구 총 거래액</span>
          <strong>{formatMoney(dashboard.grossSales)}원</strong>
        </article>
        <article className="creator-panel">
          <span>예상 수익</span>
          <strong>{formatMoney(dashboard.estimatedEarnings)}원</strong>
          <small>캠페인별 수수료율 기준 예상 금액</small>
        </article>
      </section>

      <section className="creator-panel">
        <div className="creator-section-title">
          <div>
            <span className="creator-eyebrow">CAMPAIGNS</span>
            <h2>공동구매 캠페인</h2>
          </div>
          <span>{campaigns.length}건</span>
        </div>

        {campaigns.length === 0 ? (
          <p className="creator-muted">아직 제안받은 공동구매가 없습니다.</p>
        ) : (
          <div className="creator-campaign-list">
            {campaigns.map((campaign) => (
              <article
                className="creator-campaign-card"
                key={campaign.campaignId}
              >
                <div>
                  <span className="creator-status-pill">{campaign.status}</span>
                  <h3>{campaign.preorderTitle}</h3>
                  <p>
                    주문 {campaign.orderCount.toLocaleString('ko-KR')}건 ·
                    수수료 {campaign.commissionRate}%
                  </p>
                </div>
                <div className="creator-campaign-money">
                  <span>예상 수익</span>
                  <strong>{formatMoney(campaign.estimatedEarnings)}원</strong>
                </div>

                {campaign.status === 'PROPOSED' && (
                  <div className="creator-campaign-actions">
                    <button
                      onClick={() =>
                        respondToProposal(campaign.campaignId, 'REJECTED')
                      }
                    >
                      거절
                    </button>
                    <button
                      className="creator-primary-button"
                      onClick={() =>
                        respondToProposal(campaign.campaignId, 'ACCEPTED')
                      }
                    >
                      수락
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default CreatorDashboardPage
