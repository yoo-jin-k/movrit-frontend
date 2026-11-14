/**
 * 운영자 캠페인 참여자 선정 화면입니다(/admin/campaign-participants).
 * - 서버 운영자 전용 목록과 명령을 사용합니다. 브랜드 직접 선정에 별도 운영자 승인 단계를 만들지 않습니다.
 * - 서버 API: GET /api/admin/campaign-applications, PATCH …/{id}/select|reject
 * - 권한: 운영자만. 선정 방식·상태·정원은 서버가 다시 확인합니다(403·409).
 * - 변경 이력: 표에 닉네임만 있고 상세가 목록 맨 아래에 붙던 것 → 표에 채널·지표·완료 이력을 함께 보이고,
 *   상세는 모달 창으로 띄워 신청 시점 준비 상태·조건·답변까지 보여줍니다. 선정 버튼은 처리 중·결과를 창 안에 표시합니다.
 */
import { useRef, useState } from 'react'
import { decideAdminCampaignApplication } from '../api/adminApi'
import AdminLayout, {
  AdminCard,
  AdminStatus,
} from '../components/admin/AdminLayout'
import useBusinessList from '../features/business/useBusinessList'
import { statusNames, dateLabel } from '../features/business/businessModel'
import { canSelectApplication } from '../features/business/selectionModeModel'
import { campaignRequirementSummary } from '../features/discovery/eligibilityModel'
import { myContentLink } from '../features/membership/myContentModel'
import DirectExtensionPanel from '../features/participation/DirectExtensionPanel'
import AdminDialog from '../features/admin/AdminDialog'
import {
  APPLICATION_STATUS_FILTERS,
  FULFILLMENT_LABELS,
  actionErrorMessage,
  actionResultMessage,
  applicationTone,
  completedCountLabel,
  filterApplications,
  mergeActionResult,
  metricLines,
  readinessItems,
} from '../features/admin/adminApplicationModel'

// 표·상세 창에서 함께 쓰는 채널 지표 목록입니다.
function MetricList({ metrics, compact = false }) {
  const lines = metricLines(metrics)
  if (!lines) return <span className="admin-muted">지표 확인 필요</span>
  if (!lines.length)
    return <span className="admin-muted">등록된 채널 지표 없음</span>
  return (
    <ul className={`admin-metrics${compact ? ' is-compact' : ''}`}>
      {lines.map((line) => (
        <li key={line.key}>
          <strong>{line.channel}</strong> {line.text}
          <small> · {line.verification}</small>
        </li>
      ))}
    </ul>
  )
}

function StatusTag({ status }) {
  return (
    <AdminStatus tone={applicationTone(status)}>
      {statusNames[status] || status}
    </AdminStatus>
  )
}

export default function AdminCampaignParticipantsPage() {
  const state = useBusinessList('/admin/campaign-applications')
  const [filter, setFilter] = useState('SUBMITTED'),
    [search, setSearch] = useState(''),
    [selected, setSelected] = useState(null),
    [action, setAction] = useState(''),
    [error, setError] = useState(''),
    [result, setResult] = useState(''),
    [busy, setBusy] = useState(false),
    [locked, setLocked] = useState(false)
  const inFlight = useRef(false)
  const shown = filterApplications(state.data, { status: filter, search })
  const choose = (item) => {
    setSelected(item)
    setAction('')
    setError('')
    setResult('')
    setLocked(false)
  }
  const close = () => {
    if (!busy) setSelected(null)
  }
  const submit = async () => {
    // 목록의 명시된 선정 방식과 상태를 확인하며 최종 운영자 권한은 서버가 검증합니다.
    if (
      inFlight.current ||
      locked ||
      !['select', 'reject'].includes(action) ||
      !canSelectApplication(selected, selected.selectionMode, 'admin')
    )
      return
    inFlight.current = true
    setBusy(true)
    setError('')
    setResult('')
    try {
      const data = await decideAdminCampaignApplication(selected.id, action)
      // 창은 열어 둔 채 바뀐 상태와 결과를 보여주고, 뒤의 목록은 새로 불러옵니다.
      setSelected(mergeActionResult(selected, data))
      setResult(actionResultMessage(action, selected))
      setAction('')
      state.reload()
    } catch (failure) {
      setLocked(true)
      setError(actionErrorMessage(failure.response?.status))
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  const canDecide =
    selected && canSelectApplication(selected, selected.selectionMode, 'admin')
  const channelUrl = selected && myContentLink(selected.creatorChannelUrl)
  return (
    <AdminLayout title="캠페인 참여자 선정">
      <p>
        운영자 선정 방식의 캠페인 신청만 표시됩니다. 브랜드 직접 선정은 해당
        업체가 처리합니다.
      </p>
      <div className="admin-filters">
        <label>
          <span className="sr-only">참여자 또는 캠페인 검색</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="참여자·캠페인 이름 또는 번호"
          />
        </label>
        <select
          aria-label="신청 상태"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="">전체 상태</option>
          {APPLICATION_STATUS_FILTERS.map((value) => (
            <option key={value} value={value}>
              {statusNames[value]}
            </option>
          ))}
        </select>
        <button
          className="admin-button admin-button--secondary"
          disabled={busy || state.loading}
          onClick={state.reload}
        >
          새로고침
        </button>
      </div>
      {state.loading ? (
        <p role="status">신청 내역을 확인하고 있습니다.</p>
      ) : state.error ? (
        <div role="alert" className="admin-error">
          <p>{state.error}</p>
          <button
            className="admin-button admin-button--secondary"
            onClick={state.reload}
          >
            다시 시도
          </button>
        </div>
      ) : (
        <AdminCard
          title="운영자 선정 신청"
          subtitle={`총 ${shown.length.toLocaleString()}건`}
        >
          {!shown.length ? (
            <p className="admin-muted">조건에 맞는 신청이 없습니다.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>신청</th>
                    <th>캠페인</th>
                    <th>참여자</th>
                    <th>채널·지표</th>
                    <th>완료 이력</th>
                    <th>상태</th>
                    <th>신청일</th>
                    <th>
                      <span className="sr-only">관리</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((item) => (
                    <tr key={item.id}>
                      <td data-label="신청">#{item.id}</td>
                      <td data-label="캠페인">
                        {item.campaignTitle || `캠페인 #${item.campaignId}`}
                      </td>
                      <td data-label="참여자">
                        <strong>
                          {item.creatorNickname || '닉네임 미등록'}
                        </strong>
                        <br />
                        <small className="admin-muted">
                          {FULFILLMENT_LABELS[item.fulfillmentType] ||
                            item.fulfillmentType ||
                            '참여 방식 미제공'}
                        </small>
                      </td>
                      <td data-label="채널·지표">
                        <MetricList metrics={item.creatorMetrics} compact />
                      </td>
                      <td data-label="완료 이력">
                        {completedCountLabel(item.completedCampaignCount)}
                      </td>
                      <td data-label="상태">
                        <StatusTag status={item.status} />
                      </td>
                      <td data-label="신청일">{dateLabel(item.submittedAt)}</td>
                      <td data-label="관리">
                        <button
                          className="admin-button admin-button--secondary"
                          disabled={busy}
                          onClick={() => choose(item)}
                          aria-label={`${item.creatorNickname || '참여자'} 신청 #${item.id} 상세 보기`}
                        >
                          신청 상세
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      )}
      {selected && (
        <AdminDialog
          title={`신청 #${selected.id} 상세`}
          onClose={close}
          busy={busy}
          wide
        >
          <div className="admin-applicant-head">
            <div>
              <strong>{selected.creatorNickname || '닉네임 미등록'}</strong>
              <span className="admin-muted">
                {selected.campaignTitle || `캠페인 #${selected.campaignId}`} ·
                신청일 {dateLabel(selected.submittedAt)}
              </span>
            </div>
            <StatusTag status={selected.status} />
          </div>
          {result && (
            <p role="status" className="admin-result">
              {result}
            </p>
          )}
          <dl className="admin-definition">
            <div>
              <dt>참여 방식</dt>
              <dd>
                {FULFILLMENT_LABELS[selected.fulfillmentType] ||
                  selected.fulfillmentType ||
                  '-'}
              </dd>
            </div>
            <div>
              <dt>활동 채널</dt>
              <dd>
                {channelUrl ? (
                  <a
                    href={channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    채널 열기 ↗
                  </a>
                ) : (
                  '등록된 채널 주소 없음'
                )}
              </dd>
            </div>
            <div>
              <dt>완료 이력</dt>
              <dd>{completedCountLabel(selected.completedCampaignCount)}</dd>
            </div>
            <div>
              <dt>신청 조건(신청 당시)</dt>
              <dd>
                {campaignRequirementSummary(
                  selected.eligibilityRequirementSnapshot ?? null,
                )}
              </dd>
            </div>
            <div>
              <dt>신청 준비 상태</dt>
              <dd>
                {readinessItems(selected)
                  .map(
                    ([label, done]) => `${label} ${done ? '완료' : '미완료'}`,
                  )
                  .join(' · ')}
              </dd>
            </div>
          </dl>
          <h3>채널 지표</h3>
          <MetricList metrics={selected.creatorMetrics} />
          <h3>신청 메시지</h3>
          <p className="admin-prewrap">
            {selected.message || '작성된 내용이 없습니다.'}
          </p>
          <h3>추가 답변</h3>
          {/* UI점검: 운영자 - 캠페인 참여자 - 선정 부분에 사용자의 정보가 별로없음 — 목록 응답에는 질문 이름이 없어 질문 번호로만 보입니다. 질문 이름까지 보이려면 운영자용 신청 상세 API가 필요합니다. */}
          {selected.answers?.length ? (
            <dl className="admin-definition">
              {selected.answers.map((answer) => (
                <div key={answer.questionId}>
                  <dt>질문 {answer.questionId}</dt>
                  <dd className="admin-prewrap">
                    {answer.value || '답변 없음'}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p>추가 답변이 없습니다.</p>
          )}
          {canDecide && (
            <div className="admin-decision">
              <div
                className="admin-actions-row"
                role="group"
                aria-label="선정 처리"
              >
                <button
                  className={`admin-button admin-button--secondary${action === 'select' ? ' is-selected' : ''}`}
                  aria-pressed={action === 'select'}
                  disabled={busy || locked}
                  onClick={() => setAction('select')}
                >
                  참여자 선정
                </button>
                <button
                  className={`admin-button admin-button--secondary${action === 'reject' ? ' is-selected' : ''}`}
                  aria-pressed={action === 'reject'}
                  disabled={busy || locked}
                  onClick={() => setAction('reject')}
                >
                  미선정 처리
                </button>
              </div>
              {action && (
                <div className="admin-confirm">
                  <p>
                    {selected.creatorNickname || '이 참여자'} 님을{' '}
                    {action === 'select' ? '선정' : '미선정'} 처리합니다.
                    {action === 'select' &&
                      ' 참여자가 수락하면 참여가 시작됩니다.'}
                  </p>
                  <div className="admin-actions-row">
                    <button
                      className={`admin-button ${action === 'select' ? 'admin-button--primary' : 'admin-button--danger'}`}
                      disabled={busy || locked}
                      aria-busy={busy}
                      onClick={submit}
                    >
                      {busy
                        ? '처리하고 있습니다'
                        : action === 'select'
                          ? '선정 확정'
                          : '미선정 확정'}
                    </button>
                    <button
                      className="admin-button admin-button--secondary"
                      disabled={busy}
                      onClick={() => setAction('')}
                    >
                      돌아가기
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {error && <p role="alert">{error}</p>}
          {locked && (
            <button
              className="admin-button admin-button--secondary"
              disabled={busy}
              onClick={() => {
                setSelected(null)
                state.reload()
              }}
            >
              최신 목록 확인
            </button>
          )}
          {/* 운영자 직접 연장: 체험·마감을 함께 늘리고 참여자 연장 횟수로 기록합니다. */}
          <DirectExtensionPanel
            key={`extension-${selected.id}-${selected.status}`}
            applicationId={selected.id}
            admin
            onChanged={state.reload}
          />
        </AdminDialog>
      )}
    </AdminLayout>
  )
}
