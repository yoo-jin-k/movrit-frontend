/**
 * 업체 신청 목록을 캠페인·상태로 걸러 상세·개별 선정/반려를 제공합니다.
 * 실제 처리 실패 뒤에는 최신 상태를 확인하도록 잠급니다.
 *
 * - 목록은 15초마다, 그리고 창으로 돌아올 때 조용히 새로 불러와 참여자의 수락·취소가 곧 반영됩니다.
 * - 캠페인을 고르면 '선정 1 / 모집 2명' 같은 모집 현황을 보여줍니다.
 * - 상세에서 진행 단계(신청→선정·참여 중→콘텐츠 제출→완료)와 선정 편집(선정 취소·미선정 되돌리기·참여 취소)을 제공합니다.
 */
import VisitEvidence from '../sellerCampaigns/VisitEvidence'
import { liveCampaignVisitEvidenceApi } from '../../api/liveCampaignVisitEvidenceApi'
import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useBusinessList from './useBusinessList'
import { actOnApplication, manageApplication } from './businessApi'
import { DetailDialog, ListState, PageHeader, StatusBadge } from './BusinessUi'
import { dateLabel, statusNames } from './businessModel'
import ParticipantPortfolio, {
  ParticipantMetrics,
} from './ParticipantPortfolio'
import useParticipantDetail from './useParticipantDetail'
import { readParticipantPortfolio } from '../../api/participantPortfolioApi'
import { myContentLink } from '../membership/myContentModel'
import { completedCountLabel } from './participantPortfolioModel'
import './participantPortfolio.css'
import { SELECTION_MODES, canSelectApplication } from './selectionModeModel'
import {
  PROGRESS_STEPS,
  manageActionsFor,
  managePayload,
  progressOf,
  recruitmentSummary,
} from './selectionEditModel'

// 목록 자동 새로고침 간격(밀리초)입니다.
const REFRESH_MS = 15000
export default function BusinessParticipants() {
  const state = useBusinessList('/campaigns/applications/seller', {
    refreshMs: REFRESH_MS,
  })
  const campaigns = useBusinessList('/collaborations/campaigns/seller', {
    refreshMs: REFRESH_MS,
  })
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const inFlight = useRef(false)
  const applicationId = params.get('applicationId') || ''
  const [status, setStatus] = useState(''),
    [selected, setSelected] = useState(null),
    [action, setAction] = useState(''),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [locked, setLocked] = useState(false),
    [editing, setEditing] = useState(null),
    [reason, setReason] = useState('')
  // 상세는 자동 새로고침된 최신 목록의 같은 신청을 보여줍니다(목록에서 사라졌으면 열었던 값을 유지).
  const current =
    (selected && state.data.find((item) => item.id === selected.id)) || selected
  const portfolio = useParticipantDetail(
    selected?.id ?? null,
    readParticipantPortfolio,
  )
  const campaignId = params.get('campaignId') || ''
  const shown = state.data.filter(
    (item) =>
      (!campaignId || String(item.campaignId) === campaignId) &&
      (!status || item.status === status) &&
      (!applicationId || String(item.id) === applicationId) &&
      (!search.trim() ||
        `${item.creatorNickname || ''} ${item.id}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())),
  )
  const title = (id) =>
    campaigns.data.find((c) => c.id === id)?.title || `캠페인 #${id}`
  const selectionMode = (item) =>
    campaigns.data.find((c) => String(c.id) === String(item.campaignId))
      ?.selectionMode
  const choose = (item) => {
    setSelected(item)
    setAction('')
    setEditing(null)
    setReason('')
    setError('')
    setLocked(false)
  }
  // 고른 캠페인의 모집 현황(선정·수락·신청 인원)입니다.
  const selectedCampaign = campaigns.data.find(
    (c) => String(c.id) === campaignId,
  )
  const summary = selectedCampaign
    ? recruitmentSummary(
        state.data.filter((item) => String(item.campaignId) === campaignId),
        selectedCampaign.recruitmentCount,
      )
    : null
  // 선정 편집(선정 취소·미선정 되돌리기·참여 취소)을 서버에 요청합니다.
  const submitEdit = async () => {
    if (!editing || inFlight.current || locked) return
    let payload
    try {
      payload = managePayload(editing, reason)
    } catch (failure) {
      setError(failure.message)
      return
    }
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      await manageApplication(current.id, payload)
      setNotice(
        `${current.creatorNickname || '참여자'}님의 ${editing.label} 처리가 끝났습니다. 참여자에게 알림을 보냈습니다.`,
      )
      setSelected(null)
      setEditing(null)
      setReason('')
      state.reload()
    } catch (failure) {
      setLocked(true)
      setError(
        failure.response?.data?.detail ||
          '처리 결과를 확인하지 못했습니다. 목록을 새로 불러와 결과를 확인해 주세요.',
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  // 상세에서 선택한 한 신청에만 선정/반려 명령을 보냅니다. 다른 신청의 상태는 변경하지 않습니다.
  const submit = async () => {
    if (
      !action ||
      inFlight.current ||
      locked ||
      portfolio.loading ||
      portfolio.error ||
      !portfolio.data ||
      !canSelectApplication(current, selectionMode(current), 'brand')
    )
      return
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      await actOnApplication(selected.id, action)
      setSelected(null)
      setNotice('처리되었습니다. 최신 목록을 확인해 주세요.')
      state.reload()
    } catch (failure) {
      setLocked(true)
      setError(
        failure.response?.status === 409
          ? '신청 상태 또는 모집 정원이 변경되었습니다. 목록을 새로 불러와 주세요.'
          : '처리 결과를 확인하지 못했습니다. 목록을 새로 불러와 결과를 확인해 주세요.',
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  return (
    <>
      <PageHeader
        title="참여자"
        description="신청 내용을 확인하고 참여자를 직접 선정하세요."
      />
      <p className="business-info">
        브랜드 직접 선정 캠페인만 여기에서 선정할 수 있습니다. 운영자 선정은
        관리자에게 배정됩니다. 선정과 참여자의 수락은 별도 단계이며, 참여자가
        수락한 뒤 배송 연락처를 확인하실 수 있습니다.
      </p>
      {applicationId && (
        <p className="business-info">
          신청 #{applicationId} 확인{' '}
          <button onClick={() => setParams({})}>전체 참여자 보기</button>
        </p>
      )}
      {campaigns.error && (
        <p role="alert">
          캠페인 이름과 필터 목록을 조회하지 못했습니다.{' '}
          <button onClick={campaigns.reload}>다시 확인</button>
        </p>
      )}
      <div className="business-filters">
        <input
          aria-label="참여자 이름 또는 신청 번호 검색"
          placeholder="참여자 이름 또는 신청 번호"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="캠페인 필터"
          value={campaignId}
          onChange={(e) =>
            setParams(e.target.value ? { campaignId: e.target.value } : {})
          }
        >
          <option value="">전체 캠페인</option>
          {campaignId &&
            !campaigns.data.some((c) => String(c.id) === campaignId) && (
              <option value={campaignId}>캠페인 #{campaignId}</option>
            )}
          {campaigns.data.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <select
          aria-label="신청 상태 필터"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">전체 상태</option>
          {[
            'SUBMITTED',
            'SELECTED',
            'ACTIVE',
            'CONTENT_SUBMITTED',
            'REVISION_REQUESTED',
            'COMPLETED',
            'REJECTED',
            'CANCELLED',
          ].map((s) => (
            <option key={s} value={s}>
              {statusNames[s]}
            </option>
          ))}
        </select>
        <button onClick={state.reload}>새로고침</button>
      </div>
      {summary && (
        <p className="business-recruitment" role="status">
          <strong>
            선정 {summary.selected} / 모집 {summary.capacity ?? '-'}명
          </strong>
          <span>전체 신청 {summary.applied}명</span>
          {summary.remaining != null && (
            <span>
              {summary.remaining > 0
                ? `${summary.remaining}명 더 선정할 수 있습니다`
                : '모집 인원이 모두 선정되었습니다'}
            </span>
          )}
        </p>
      )}
      {notice && (
        <p role="status" className="business-info">
          {notice}
        </p>
      )}
      <section className="business-panel">
        <div className="business-panel-heading">
          <h2>
            참여자 확인{' '}
            <span>{state.loading || state.error ? '—' : shown.length}</span>
          </h2>
          <small>선정하면 참여자의 수락 없이 바로 참여가 시작됩니다.</small>
        </div>
        <ListState state={state}>
          {shown.length ? (
            <div className="business-table-scroll">
              <table className="participants-table">
                <thead>
                  <tr>
                    <th>참여자</th>
                    <th>캠페인</th>
                    <th>채널·지표</th>
                    <th>완료 이력</th>
                    <th>상태</th>
                    <th>신청일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((item) => (
                    <tr key={item.id}>
                      <td data-label="참여자">
                        <div className="business-cell-media">
                          <span className="business-avatar" aria-hidden="true">
                            {item.creatorNickname?.slice(0, 1) || 'M'}
                          </span>
                          <button
                            disabled={busy}
                            className="participant-name-button"
                            onClick={() => choose(item)}
                            aria-label={`${item.creatorNickname || '참여자'} 신청 ${item.id} 상세 보기`}
                          >
                            {item.creatorNickname || '닉네임 미등록'}
                          </button>
                        </div>
                      </td>
                      <td data-label="캠페인">{title(item.campaignId)}</td>
                      <td data-label="채널·지표">
                        <ParticipantMetrics
                          metrics={item.creatorMetrics}
                          compact
                        />
                        {myContentLink(item.creatorChannelUrl) && (
                          <a
                            className="business-link"
                            href={myContentLink(item.creatorChannelUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            활동 채널 ↗
                          </a>
                        )}
                      </td>
                      <td data-label="완료 이력">
                        {completedCountLabel(item.completedCampaignCount)}
                      </td>
                      <td data-label="상태">
                        <StatusBadge status={item.status} />
                      </td>
                      <td data-label="신청일">{dateLabel(item.submittedAt)}</td>
                      <td data-label="관리">
                        <button disabled={busy} onClick={() => choose(item)}>
                          상세 보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="business-empty">조건에 맞는 신청이 없습니다.</div>
          )}
        </ListState>
      </section>
      {current && (
        <DetailDialog
          title={`${current.creatorNickname} · 신청 상세`}
          onClose={() => setSelected(null)}
          busy={busy}
        >
          <div className="participant-navigation" aria-label="참여자 이동">
            <button
              disabled={
                busy || shown.findIndex((item) => item.id === selected.id) <= 0
              }
              onClick={() =>
                choose(
                  shown[shown.findIndex((item) => item.id === selected.id) - 1],
                )
              }
            >
              이전 참여자
            </button>
            <button
              disabled={
                busy ||
                shown.findIndex((item) => item.id === selected.id) >=
                  shown.length - 1
              }
              onClick={() =>
                choose(
                  shown[shown.findIndex((item) => item.id === selected.id) + 1],
                )
              }
            >
              다음 참여자
            </button>
          </div>
          <StatusBadge status={current.status} />
          <h3>{title(current.campaignId)}</h3>
          {progressOf(current.status).ended ? (
            <p className="business-info">{progressOf(current.status).ended}</p>
          ) : (
            <ol className="participant-progress" aria-label="진행 단계">
              {PROGRESS_STEPS.map(([code, label], index) => (
                <li
                  key={code}
                  className={
                    index < progressOf(current.status).index
                      ? 'is-done'
                      : index === progressOf(current.status).index
                        ? 'is-current'
                        : ''
                  }
                  aria-current={
                    index === progressOf(current.status).index
                      ? 'step'
                      : undefined
                  }
                >
                  {label}
                </li>
              ))}
            </ol>
          )}
          <p>
            선정 방식: {SELECTION_MODES[selectionMode(current)] || '확인 필요'}
            {selectionMode(current) === 'OPERATOR' &&
              ' · 운영자가 선정 결과를 처리합니다.'}
          </p>
          <p>
            <Link
              className="business-link"
              to={`/seller/contents?applicationId=${current.id}`}
            >
              이 참여자의 제출 콘텐츠 확인 →
            </Link>
          </p>
          {current.fulfillmentType === 'VISIT' && (
            <VisitEvidence
              key={`visit-${current.id}`}
              api={liveCampaignVisitEvidenceApi}
              applicationId={current.id}
            />
          )}
          {current.fulfillmentType === 'DELIVERY' && (
            <section>
              <h3>배송 연락처</h3>
              {current.shippingContact ? (
                <p>
                  {current.shippingContact.recipientName}
                  <br />
                  {current.shippingContact.recipientPhone}
                  <br />
                  {[
                    current.shippingContact.postalCode,
                    current.shippingContact.address1,
                    current.shippingContact.address2,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                </p>
              ) : (
                <p>
                  {[
                    'ACTIVE',
                    'CONTENT_SUBMITTED',
                    'REVISION_REQUESTED',
                    'COMPLETED',
                  ].includes(current.status)
                    ? '등록된 배송 연락처가 없습니다.'
                    : '참여자가 수락한 뒤 확인할 수 있습니다.'}
                </p>
              )}
            </section>
          )}
          {current.status === 'CANCELLED' && (
            <p>
              취소 사유: {current.cancellationReason || '기록 없음'} ·{' '}
              {dateLabel(current.cancelledAt)}
            </p>
          )}
          <section>
            <h3>신청 메시지</h3>
            <p>{current.message || '작성된 내용이 없습니다.'}</p>
          </section>
          {portfolio.loading ? (
            <p role="status">참여자 프로필과 완료 이력을 확인하고 있습니다.</p>
          ) : portfolio.error ? (
            <div role="alert">
              <p>{portfolio.error}</p>
              <button onClick={portfolio.reload}>상세 다시 확인</button>
            </div>
          ) : portfolio.data ? (
            <ParticipantPortfolio data={portfolio.data} />
          ) : null}
          {!portfolio.loading &&
            !portfolio.error &&
            portfolio.data &&
            canSelectApplication(current, selectionMode(current), 'brand') && (
              <>
                <div className="business-actions participant-decision">
                  <button
                    disabled={busy || locked}
                    onClick={() => setAction('select')}
                  >
                    참여자 선정
                  </button>
                  <button
                    disabled={busy || locked}
                    onClick={() => setAction('reject')}
                  >
                    미선정 처리
                  </button>
                </div>
                {action && (
                  <div className="business-info">
                    <p>
                      이 신청을 {action === 'select' ? '선정' : '미선정'}{' '}
                      처리하시겠습니까?
                    </p>
                    <button
                      className="business-primary"
                      disabled={busy || locked}
                      onClick={submit}
                    >
                      {busy ? '처리 중...' : '확정'}
                    </button>
                  </div>
                )}
              </>
            )}
          {selectionMode(current) === 'BRAND_DIRECT' &&
            manageActionsFor(current.status, {
              experienceConfirmed: Boolean(current.experienceConfirmedAt),
            }).length > 0 && (
              <section className="participant-edit" aria-label="선정 편집">
                <h3>선정 편집</h3>
                <div className="business-actions">
                  {manageActionsFor(current.status, {
                    experienceConfirmed: Boolean(current.experienceConfirmedAt),
                  }).map((item) => (
                    <button
                      key={item.action}
                      disabled={busy || locked}
                      aria-pressed={editing?.action === item.action}
                      onClick={() => {
                        setEditing(item)
                        setReason('')
                        setError('')
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {editing && (
                  <div className="business-info">
                    <p>{editing.description}</p>
                    {editing.needsReason && (
                      <label>
                        취소 사유 (참여자에게 전달됩니다)
                        <textarea
                          rows={3}
                          maxLength={500}
                          value={reason}
                          onChange={(event) => setReason(event.target.value)}
                          placeholder="예) 참여자 요청으로 일정이 맞지 않아 취소합니다."
                        />
                      </label>
                    )}
                    <button
                      className="business-primary"
                      disabled={busy || locked}
                      onClick={submitEdit}
                    >
                      {busy ? '처리 중...' : `${editing.label} 확정`}
                    </button>
                    <button disabled={busy} onClick={() => setEditing(null)}>
                      돌아가기
                    </button>
                  </div>
                )}
              </section>
            )}
          {error && (
            <p role="alert" className="business-error">
              {error}
            </p>
          )}
          {locked && (
            <button
              onClick={() => {
                setSelected(null)
                state.reload()
              }}
            >
              최신 목록 확인
            </button>
          )}
        </DetailDialog>
      )}
    </>
  )
}
