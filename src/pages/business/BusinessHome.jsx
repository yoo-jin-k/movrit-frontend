/**
 * 승인 업체의 캠페인·신청·콘텐츠 목록으로 대시보드 수치를 계산합니다.
 * 조회 실패와 빈 목록을 구분하고 앞으로 마감하는 캠페인만 별도로 표시합니다.
 * 업체 미선정: 신청이 있었는데 선정 발표 시각(없으면 모집 종료)까지 아무도 선정하지 않은 캠페인 수입니다.
 */
import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { readMyUnselected } from '../../api/participationChangeApi'
import useBusinessList from '../../features/business/useBusinessList'
import {
  CampaignCards,
  ListState,
  PageHeader,
} from '../../features/business/BusinessUi'
import {
  dateLabel,
  upcomingCampaigns,
} from '../../features/business/businessModel'
export default function BusinessHome() {
  const { profile } = useOutletContext()
  const campaigns = useBusinessList('/collaborations/campaigns/seller')
  const applicants = useBusinessList('/campaigns/applications/seller')
  const contents = useBusinessList('/campaign-contents/seller')
  const stats = [
    ['공개 캠페인', campaigns, 'campaigns', (c) => c.open],
    [
      '선정을 기다리는 신청',
      applicants,
      'participants',
      (c) => c.status === 'SUBMITTED',
    ],
    [
      '참여 중인 참여자',
      applicants,
      'participants',
      (c) => c.status === 'ACTIVE' || c.status === 'SELECTED',
    ],
    ['검토할 콘텐츠', contents, 'contents', (c) => c.status === 'SUBMITTED'],
  ]
  const deadlines = upcomingCampaigns(campaigns.data)
  const [unselected, setUnselected] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    readMyUnselected(controller.signal)
      .then(setUnselected)
      .catch(() => {
        if (!controller.signal.aborted) setUnselected(false)
      })
    return () => controller.abort()
  }, [])
  return (
    <>
      <PageHeader
        title="홈"
        description="오늘의 캠페인 운영 현황을 확인해 주세요."
      >
        <Link className="business-primary" to="/seller/campaigns/new">
          + 새 캠페인
        </Link>
      </PageHeader>
      <section className="business-welcome">
        <div>
          <small>함께 만드는 좋은 경험</small>
          <h2>{profile.brandName || profile.businessName}님, 반갑습니다.</h2>
          <p>새로운 만남을 준비하고, 캠페인의 다음 단계를 이어가세요.</p>
        </div>
        <div className="business-welcome-art" aria-hidden="true">
          M<span>✦</span>
        </div>
      </section>
      <div className="business-stats">
        {stats.map(([label, state, path, filter]) => (
          <Link key={label} to={`/seller/${path}`} className="business-stat">
            <span>{label} ↗</span>
            <strong>
              {state.loading || state.error
                ? '—'
                : state.data.filter(filter).length}
              <small> 건</small>
            </strong>
            <small>
              {state.error
                ? '조회 실패 · 해당 메뉴에서 재시도'
                : state.loading
                  ? '불러오는 중'
                  : '조회한 업체 목록 기준'}
            </small>
          </Link>
        ))}
      </div>
      <div className="business-home-grid">
        <section className="business-panel">
          <h2>지금 확인할 업무</h2>
          {stats.slice(1).map(([label, state, path, filter]) => (
            <div className="business-task" key={label}>
              <span className="business-task-icon" aria-hidden="true">
                ✓
              </span>
              <div>
                <h3>{label}</h3>
                <p>
                  {state.error
                    ? '목록을 다시 확인해 주세요.'
                    : state.loading
                      ? '확인 중입니다.'
                      : `${state.data.filter(filter).length}건의 내역을 확인하실 수 있습니다.`}
                </p>
              </div>
              <Link to={`/seller/${path}`}>확인하기 →</Link>
            </div>
          ))}
        </section>
        <section className="business-panel">
          <h2>가까운 모집 마감</h2>
          {campaigns.error ? (
            <p role="alert">일정을 불러오지 못했습니다.</p>
          ) : campaigns.loading ? (
            <p>일정을 확인하고 있습니다.</p>
          ) : deadlines.length ? (
            deadlines.map((c) => (
              <Link
                className="business-deadline"
                key={c.id}
                to={`/seller/campaigns/${c.id}`}
              >
                <small>{dateLabel(c.endAt)}</small>
                <strong>{c.title}</strong>
              </Link>
            ))
          ) : (
            <p>예정된 모집 마감이 없습니다.</p>
          )}
        </section>
        <section className="business-panel" aria-label="업체 미선정 기록">
          <h2>업체 미선정</h2>
          {unselected === null ? (
            <p>확인하고 있습니다.</p>
          ) : unselected === false ? (
            <p role="alert">미선정 기록을 불러오지 못했습니다.</p>
          ) : (
            <>
              <p>
                신청자가 있었는데 선정 발표까지 아무도 선정하지 않은 캠페인{' '}
                <strong>{unselected.count}건</strong>
              </p>
              {unselected.records.slice(0, 3).map((record) => (
                <Link
                  className="business-deadline"
                  key={record.campaignId}
                  to={`/seller/participants?campaignId=${record.campaignId}`}
                >
                  <small>
                    {dateLabel(record.recordedAt)} · 신청{' '}
                    {record.applicationCount}건
                  </small>
                  <strong>{record.campaignTitle}</strong>
                </Link>
              ))}
              <p>
                선정 발표일을 넘기지 않도록 신청자를 확인해 주세요. 이 기록은
                운영자도 함께 확인합니다.
              </p>
            </>
          )}
        </section>
      </div>
      <div className="business-section-heading">
        <h2>내 캠페인</h2>
        <Link to="/seller/campaigns">전체 보기 →</Link>
      </div>
      <ListState state={campaigns}>
        <CampaignCards campaigns={campaigns.data.slice(0, 3)} />
      </ListState>
      <p className="business-footnote">
        조회된 업체 전용 목록을 기준으로 표시합니다. 캠페인 공개 여부와 모집
        일정은 별도로 확인해 주세요.
      </p>
    </>
  )
}
