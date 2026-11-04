/** 서버 운영자 전용 목록과 명령을 사용합니다. 브랜드 직접 선정에 별도 운영자 승인 단계를 만들지 않습니다. */
import { useRef, useState } from 'react'
import api from '../api/axios'
import AdminLayout, { AdminCard } from '../components/admin/AdminLayout'
import useBusinessList from '../features/business/useBusinessList'
import { statusNames, dateLabel } from '../features/business/businessModel'
import { canSelectApplication } from '../features/business/selectionModeModel'
import DirectExtensionPanel from '../features/participation/DirectExtensionPanel'
export default function AdminCampaignParticipantsPage() {
  const state = useBusinessList('/admin/campaign-applications')
  const [filter, setFilter] = useState('SUBMITTED'),
    [search, setSearch] = useState(''),
    [selected, setSelected] = useState(null),
    [action, setAction] = useState(''),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [locked, setLocked] = useState(false)
  const inFlight = useRef(false)
  const shown = state.data.filter(
    (item) =>
      (!filter || item.status === filter) &&
      `${item.creatorNickname || ''} ${item.campaignTitle || ''} ${item.campaignId} ${item.id}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  )
  const choose = (item) => {
    setSelected(item)
    setAction('')
    setError('')
    setLocked(false)
  }
  const reload = () => {
    setSelected(null)
    state.reload()
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
    try {
      await api.patch(
        `/admin/campaign-applications/${selected.id}/${action}`,
        undefined,
        { timeout: 15000 },
      )
      setNotice('선정 결과를 반영했습니다. 참여자의 수락은 별도 단계입니다.')
      reload()
    } catch (failure) {
      setLocked(true)
      setError(
        failure.response?.status === 403
          ? '이 신청을 처리할 운영자 권한 또는 선정 방식을 확인해 주세요.'
          : failure.response?.status === 409
            ? '상태 또는 정원이 변경되었습니다. 최신 목록을 확인해 주세요.'
            : '처리 결과를 확인하지 못했습니다. 최신 목록에서 확인해 주세요.',
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  return (
    <AdminLayout title="캠페인 참여자 선정">
      <p>
        운영자 선정 방식의 캠페인 신청만 표시됩니다. 브랜드 직접 선정은 해당
        업체가 처리합니다.
      </p>
      <div className="admin-filters">
        <input
          aria-label="참여자 또는 캠페인 검색"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="참여자·캠페인 이름 또는 번호"
        />
        <select
          aria-label="신청 상태"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="">전체 상태</option>
          {[
            'SUBMITTED',
            'SELECTED',
            'ACTIVE',
            'REJECTED',
            'CANCELLED',
            'CONTENT_SUBMITTED',
            'REVISION_REQUESTED',
            'COMPLETED',
          ].map((value) => (
            <option key={value} value={value}>
              {statusNames[value]}
            </option>
          ))}
        </select>
        <button
          className="admin-button admin-button--secondary"
          disabled={busy || state.loading}
          onClick={reload}
        >
          새로고침
        </button>
      </div>
      {notice && <p role="status">{notice}</p>}
      {state.loading ? (
        <p role="status">신청 내역을 확인하고 있습니다.</p>
      ) : state.error ? (
        <p role="alert">{state.error}</p>
      ) : !shown.length ? (
        <p>조건에 맞는 신청이 없습니다.</p>
      ) : (
        <AdminCard title="운영자 선정 신청">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>신청</th>
                  <th>캠페인</th>
                  <th>참여자</th>
                  <th>상태</th>
                  <th>신청일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((item) => (
                  <tr key={item.id}>
                    <td data-label="신청">#{item.id}</td>
                    <td data-label="캠페인">
                      {item.campaignTitle || `캠페인 #${item.campaignId}`}
                    </td>
                    <td data-label="참여자">{item.creatorNickname}</td>
                    <td data-label="상태">
                      {statusNames[item.status] || item.status}
                    </td>
                    <td data-label="신청일">{dateLabel(item.submittedAt)}</td>
                    <td data-label="관리">
                      <button
                        className="admin-button admin-button--secondary"
                        disabled={busy}
                        onClick={() => choose(item)}
                      >
                        신청 상세
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
      {selected && (
        <AdminCard title={`신청 #${selected.id} 상세`}>
          <p>
            {selected.campaignTitle || `캠페인 #${selected.campaignId}`} ·{' '}
            {selected.creatorNickname} · {statusNames[selected.status]}
          </p>
          <h3>신청 메시지</h3>
          <p>{selected.message || '작성된 내용이 없습니다.'}</p>
          <h3>추가 답변</h3>
          {selected.answers?.length ? (
            selected.answers.map((answer) => (
              <p key={answer.questionId}>
                질문 {answer.questionId}: {answer.value || '답변 없음'}
              </p>
            ))
          ) : (
            <p>추가 답변이 없습니다.</p>
          )}
          {canSelectApplication(selected, selected.selectionMode, 'admin') && (
            <div className="admin-actions">
              <button
                className="admin-button admin-button--secondary"
                disabled={busy || locked}
                onClick={() => setAction('select')}
              >
                참여자 선정
              </button>
              <button
                className="admin-button admin-button--secondary"
                disabled={busy || locked}
                onClick={() => setAction('reject')}
              >
                미선정 처리
              </button>
              {action && (
                <div>
                  <p>
                    이 신청을 {action === 'select' ? '선정' : '미선정'}{' '}
                    처리하시겠습니까?
                  </p>
                  <button
                    className="admin-button admin-button--secondary"
                    disabled={busy || locked}
                    onClick={submit}
                  >
                    결과 확정
                  </button>
                  <button
                    className="admin-button admin-button--secondary"
                    disabled={busy}
                    onClick={() => setAction('')}
                  >
                    돌아가기
                  </button>
                </div>
              )}
            </div>
          )}
          {/* 운영자 직접 연장: 체험·마감을 함께 늘리고 참여자 연장 횟수로 기록합니다. */}
          <DirectExtensionPanel
            key={`extension-${selected.id}-${selected.status}`}
            applicationId={selected.id}
            admin
            onChanged={reload}
          />
          {error && <p role="alert">{error}</p>}
          {locked && (
            <button
              className="admin-button admin-button--secondary"
              disabled={busy}
              onClick={reload}
            >
              최신 목록 확인
            </button>
          )}
          <button
            className="admin-button admin-button--secondary"
            disabled={busy}
            onClick={() => setSelected(null)}
          >
            상세 닫기
          </button>
        </AdminCard>
      )}
    </AdminLayout>
  )
}
