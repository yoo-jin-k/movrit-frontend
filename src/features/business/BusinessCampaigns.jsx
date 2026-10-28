/**
 * 내 캠페인 목록의 검색·모집 상태 필터와 조회 전용 상세를 제공합니다.
 * 신청 수는 현재 응답 상태를 집계하며 신규/수정 경로에서는 공통 편집기에 실제 미디어 API를 주입합니다.
 */
import { liveCampaignMediaApi } from '../../api/liveCampaignMediaApi'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useBusinessList from './useBusinessList'
import { DetailDialog, ListState, PageHeader } from './BusinessUi'
import { dateLabel } from './businessModel'
import { readCampaignRequirement } from '../../api/campaignRequirementApi'
import { campaignRequirementSummary } from '../discovery/eligibilityModel'
import SellerCampaignManager from '../sellerCampaigns/SellerCampaignManager'
import CampaignContactEditor from './CampaignContactEditor'

// 누적 선정/수락 이력은 추론하지 않고 현재 응답 상태별 건수만 집계합니다.
function CampaignCounts({ campaignId, applications }) {
  if (applications.loading || applications.error)
    return (
      <small>
        {applications.error ? '신청 집계 조회 실패' : '신청 집계 확인 중'}
      </small>
    )
  const items = applications.data.filter(
    (item) => item.campaignId === campaignId,
  )
  return (
    <>
      <strong>
        {items.filter((item) => item.status === 'SELECTED').length} ·{' '}
        {items.filter((item) => item.status === 'ACTIVE').length} ·{' '}
        {items.filter((item) => item.status === 'CONTENT_SUBMITTED').length}
      </strong>
      <small>수락 대기 · 참여 중 · 제출 상태</small>
    </>
  )
}
function CampaignDetail({ campaign, applications, onClose }) {
  const [condition, setCondition] = useState({ loading: true })
  useEffect(() => {
    const controller = new AbortController()
    readCampaignRequirement(campaign.id, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setCondition({ value, loading: false })
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setCondition({ error: true, loading: false })
      })
    return () => controller.abort()
  }, [campaign.id])
  return (
    <DetailDialog title="캠페인 상세" onClose={onClose}>
      <span className="business-badge">
        {campaign.open ? '공개' : '비공개'}
      </span>
      <h3>{campaign.title}</h3>
      <p>
        {campaign.brandName} · {campaign.category || '분류 미제공'}
      </p>
      <CampaignContactEditor campaignId={campaign.id} />
      <h3>운영 정보</h3>
      <dl className="business-details">
        <div>
          <dt>선정 주체</dt>
          <dd>업체 직접 선정</dd>
        </div>
        <div>
          <dt>참여 조건</dt>
          <dd>
            {condition.loading
              ? '확인 중입니다.'
              : condition.error
                ? '조건을 조회하지 못했습니다. 편집 화면에서 다시 확인해 주세요.'
                : campaignRequirementSummary(condition.value)}
          </dd>
        </div>
        <div>
          <dt>모집 시작</dt>
          <dd>{dateLabel(campaign.startAt)}</dd>
        </div>
        <div>
          <dt>모집 마감</dt>
          <dd>{dateLabel(campaign.endAt)}</dd>
        </div>
        <div>
          <dt>모집 정원</dt>
          <dd>{campaign.recruitmentCount ?? '미제공'}명</dd>
        </div>
        <div>
          <dt>참여 현황</dt>
          <dd>
            <CampaignCounts
              campaignId={campaign.id}
              applications={applications}
            />
          </dd>
        </div>
      </dl>
      <p className="business-info">
        선정과 참여 수락은 별도입니다. 콘텐츠의 업체 검토 완료도 운영자 최종
        승인과 구분됩니다.
      </p>
      <div className="business-actions">
        <Link
          className="business-primary"
          to={`/seller/campaigns/${campaign.id}`}
        >
          정보 수정
        </Link>
        <Link to={`/seller/participants?campaignId=${campaign.id}`}>
          참여자 확인 →
        </Link>
      </div>
    </DetailDialog>
  )
}
export function BusinessCampaigns() {
  const state = useBusinessList('/collaborations/campaigns/seller')
  const applications = useBusinessList('/campaigns/applications/seller')
  const [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [selected, setSelected] = useState(null)
  const matchesFilter = (c, key) => key === 'all' || c.open === (key === 'open')
  const shown = state.data.filter(
    (c) =>
      `${c.title} ${c.brandName}`
        .toLowerCase()
        .includes(search.toLowerCase()) && matchesFilter(c, filter),
  )
  return (
    <>
      <PageHeader
        title="캠페인"
        description="캠페인별 진행 상황과 필요한 업무를 확인해 주세요."
      >
        <Link className="business-primary" to="/seller/campaigns/new">
          + 새 캠페인 등록
        </Link>
      </PageHeader>
      <div className="business-tabs" aria-label="캠페인 공개 상태">
        {[
          ['all', '전체'],
          ['open', '공개'],
          ['closed', '비공개'],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}{' '}
            <span>
              {state.loading || state.error
                ? '—'
                : state.data.filter((c) => matchesFilter(c, key)).length}
            </span>
          </button>
        ))}
      </div>
      <div className="business-filters">
        <input
          aria-label="캠페인명 또는 브랜드 검색"
          placeholder="캠페인명 또는 브랜드를 검색해 주세요"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <small>
          {state.loading || state.error
            ? '목록 확인 중'
            : `조회한 캠페인 ${shown.length}건`}
        </small>
        <button
          onClick={() => {
            state.reload()
            applications.reload()
          }}
        >
          새로고침
        </button>
      </div>
      <section className="business-panel">
        <ListState state={state}>
          {shown.length ? (
            <>
              <div className="business-table-scroll">
                <table className="business-campaign-table">
                  <thead>
                    <tr>
                      <th>캠페인</th>
                      <th>공개 상태</th>
                      <th>선정 주체</th>
                      <th>전체 신청 / 정원</th>
                      <th>현재 참여 현황</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div className="business-cell-media">
                            <span
                              className="business-mini-cover"
                              aria-hidden="true"
                            >
                              M
                            </span>
                            <div>
                              <strong>{c.title}</strong>
                              <small>
                                {c.brandName} · {c.category || '분류 미제공'}
                              </small>
                              <small>모집 마감 {dateLabel(c.endAt)}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="business-badge">
                            {c.open ? '공개' : '비공개'}
                          </span>
                        </td>
                        <td>업체 직접 선정</td>
                        <td>
                          {applications.loading || applications.error
                            ? '—'
                            : applications.data.filter(
                                (a) => a.campaignId === c.id,
                              ).length}{' '}
                          / {c.recruitmentCount ?? '—'}명
                        </td>
                        <td>
                          <CampaignCounts
                            campaignId={c.id}
                            applications={applications}
                          />
                        </td>
                        <td>
                          <button onClick={() => setSelected(c)}>
                            상세 보기
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="business-table-foot">
                조회한 업체 목록 기준 · {shown.length}개 캠페인
              </div>
            </>
          ) : (
            <div className="business-empty">검색 결과가 없습니다.</div>
          )}
        </ListState>
      </section>
      <p className="business-info">
        현재는 업체 직접 선정 방식입니다. 공개 상태와 모집 일정은 별도로 확인해
        주세요.
      </p>
      {selected && (
        <CampaignDetail
          campaign={selected}
          applications={applications}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
export function BusinessCampaignEditor() {
  const { campaignId } = useParams()
  return (
    <>
      <PageHeader
        title={campaignId ? '캠페인 수정' : '캠페인 작성'}
        description="캠페인 정보와 신청 폼을 함께 확인해 주세요."
      >
        <Link className="business-secondary" to="/seller/campaigns">
          캠페인 목록
        </Link>
      </PageHeader>
      <div className="business-editor-steps">
        <span>01 기본 정보</span>
        <span>02 일정·조건</span>
        <span>03 신청 폼</span>
        <span>04 미리보기</span>
      </div>
      <SellerCampaignManager
        mediaApi={liveCampaignMediaApi}
        key={campaignId || 'new'}
        initialCampaignId={campaignId}
        dashboard
      />
    </>
  )
}
