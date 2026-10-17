import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useBusinessList from './useBusinessList'
import ParticipantComparison from './ParticipantComparison'
import { actOnApplication } from './businessApi'
import { DetailDialog, ListState, PageHeader, StatusBadge } from './BusinessUi'
import { dateLabel, statusNames } from './businessModel'
import { campaignRequirementSummary } from '../discovery/eligibilityModel'
export default function BusinessParticipants() {
  const state = useBusinessList('/campaigns/applications/seller')
  const campaigns = useBusinessList('/collaborations/campaigns/seller')
  const [params, setParams] = useSearchParams()
  const [checkedIds, setCheckedIds] = useState([])
  const [comparing, setComparing] = useState(false)
  const [status, setStatus] = useState(''),
    [selected, setSelected] = useState(null),
    [action, setAction] = useState(''),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [locked, setLocked] = useState(false)
  const campaignId = params.get('campaignId') || ''
  const shown = state.data.filter(
    (item) =>
      (!campaignId || String(item.campaignId) === campaignId) &&
      (!status || item.status === status),
  )
  const compared = shown.filter((item) => checkedIds.includes(item.id))
  const title = (id) =>
    campaigns.data.find((c) => c.id === id)?.title || `캠페인 #${id}`
  const choose = (item) => {
    setSelected(item)
    setAction('')
    setError('')
    setLocked(false)
  }
  const submit = async () => {
    if (!action || busy || locked) return
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
        현재는 업체 직접 선정 방식입니다. 선정과 참여자의 수락은 별도 단계이며,
        선정 전 배송 연락처는 표시하지 않습니다.
      </p>
      <div className="business-filters">
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
      {notice && (
        <p role="status" className="business-info">
          {notice}
        </p>
      )}
      <section className="business-panel">
        <div className="business-panel-heading">
          <h2>
            신청자 확인·비교{' '}
            <span>{state.loading || state.error ? '—' : shown.length}</span>
          </h2>
          <small>선정과 참여 수락은 별도입니다.</small>
        </div>
        <ListState state={state}>
          {shown.length ? (
            <div className="business-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>비교</th>
                    <th>참여자</th>
                    <th>캠페인</th>
                    <th>참여 방식</th>
                    <th>상태</th>
                    <th>신청일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          className="business-compare-check"
                          type="checkbox"
                          aria-label={`${item.creatorNickname} 신청 ${item.id} 비교 선택`}
                          checked={compared.some((v) => v.id === item.id)}
                          onChange={(event) =>
                            setCheckedIds((ids) =>
                              event.target.checked
                                ? [...ids, item.id]
                                : ids.filter((id) => id !== item.id),
                            )
                          }
                        />
                      </td>
                      <td>
                        <div className="business-cell-media">
                          <span className="business-avatar" aria-hidden="true">
                            {item.creatorNickname?.slice(0, 1) || 'M'}
                          </span>
                          <strong>{item.creatorNickname}</strong>
                        </div>
                      </td>
                      <td>{title(item.campaignId)}</td>
                      <td>
                        {item.fulfillmentType === 'DELIVERY'
                          ? '배송'
                          : item.fulfillmentType === 'VISIT'
                            ? '방문'
                            : '미확인'}
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>{dateLabel(item.submittedAt)}</td>
                      <td>
                        <button onClick={() => choose(item)}>상세 보기</button>
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
        {!state.loading && !state.error && shown.length > 0 && (
          <div className="business-selection-bar">
            <span>
              <strong>{compared.length}명</strong> 비교 선택 · 선정 결과에는
              반영되지 않습니다.
            </span>
            <button
              disabled={compared.length < 2}
              onClick={() => setComparing(true)}
            >
              선택 비교
            </button>
          </div>
        )}
      </section>
      {comparing && (
        <ParticipantComparison
          items={compared}
          campaignTitle={title}
          onClose={() => setComparing(false)}
        />
      )}
      {selected && (
        <DetailDialog
          title={`${selected.creatorNickname} · 신청 상세`}
          onClose={() => setSelected(null)}
          busy={busy}
        >
          <StatusBadge status={selected.status} />
          <h3>{title(selected.campaignId)}</h3>
          <dl className="business-details">
            <div>
              <dt>신청 당시 조건</dt>
              <dd>
                {campaignRequirementSummary(
                  selected.eligibilityRequirementSnapshot,
                )}
              </dd>
            </div>
            <div>
              <dt>조건 버전</dt>
              <dd>{selected.eligibilityRequirementVersion ?? '조건 없음'}</dd>
            </div>
            <div>
              <dt>이메일 확인</dt>
              <dd>{selected.emailVerified ? '확인됨' : '미확인'}</dd>
            </div>
            <div>
              <dt>신청 메시지</dt>
              <dd>{selected.message || '작성된 내용이 없습니다.'}</dd>
            </div>
          </dl>
          <h3>신청 답변</h3>
          {selected.answers?.length ? (
            selected.answers.map((a) => (
              <p key={a.questionId}>
                <strong>질문 {a.questionId}</strong>
                <br />
                {a.value || '답변 없음'}
              </p>
            ))
          ) : (
            <p>추가 답변이 없습니다.</p>
          )}
          <p className="business-info">
            지표 값·출처·측정일은 이 목록에서 제공되지 않습니다. 미확인 값을
            0으로 판단하지 않습니다.
          </p>
          {selected.status === 'SUBMITTED' && (
            <>
              <div className="business-actions">
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
