/**
 * 운영자 '신고·제재' 화면입니다(/admin/moderation).
 *
 * 흐름: 회원이 커뮤니티 글·댓글, 채팅 메시지, 캠페인 콘텐츠를 신고 → (이 화면) 운영자가 신고 당시 내용을 보고 처리
 * - 기각: 위반이 아니면 그대로 둡니다(이 신고만 닫음).
 * - 경고: 작성자에게 경고 알림을 보냅니다.
 * - 가리기: 글·댓글·메시지를 가리고 작성자에게 알립니다(캠페인 콘텐츠는 외부 게시물이라 가릴 수 없음).
 * - 이용 정지: 내용을 가리고 작성자 계정을 정지합니다(로그인 불가). 정지 해제는 '회원' 메뉴에서 합니다.
 * 조치하면 같은 대상의 다른 접수 신고도 함께 닫히고, 신고한 회원에게 결과가 알림으로 갑니다.
 * - 서버 API: GET /api/admin/content-reports, PATCH /api/admin/content-reports/{id}
 */
import { useState } from 'react'
import AdminLayout, { AdminCard } from '../components/admin/AdminLayout'
import useBusinessList from '../features/business/useBusinessList'
import { dateLabel } from '../features/business/businessModel'
import { handleReport } from '../api/participationApi'
import {
  REPORT_REASONS,
  REPORT_STATUS,
  REPORT_TARGETS,
  reportActionsFor,
} from '../features/participation/participationModel'

const reasonLabel = (code) =>
  REPORT_REASONS.find(([value]) => value === code)?.[1] || code

export default function AdminModerationPage() {
  const state = useBusinessList('/admin/content-reports')
  const [filter, setFilter] = useState('OPEN')
  const [selectedId, setSelectedId] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const rows = (state.data || []).filter(
    (item) => !filter || item.status === filter,
  )
  const selected =
    (state.data || []).find((item) => item.id === selectedId) || null

  const act = async (action, label) => {
    if (busy || !selected) return
    setBusy(true)
    setError('')
    try {
      await handleReport(selected.id, action, note)
      setNotice(`신고 #${selected.id} 처리를 마쳤습니다(${label}).`)
      setSelectedId(null)
      setNote('')
      state.reload()
    } catch (failure) {
      setError(failure.response?.data?.detail || '처리하지 못했습니다.')
      if (failure.response?.status === 409) state.reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout title="신고·제재">
      <p>
        회원이 신고한 커뮤니티 글·댓글, 채팅 메시지, 캠페인 콘텐츠를 확인하고
        처리합니다. 신고 당시 내용이 함께 남아 있어 원문이 지워져도 판단할 수
        있습니다.
      </p>
      <div className="admin-filters">
        <select
          aria-label="처리 상태"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="OPEN">접수(처리 전)</option>
          <option value="RESOLVED">조치 완료</option>
          <option value="DISMISSED">기각</option>
          <option value="">전체</option>
        </select>
        <button
          className="admin-button admin-button--secondary"
          onClick={state.reload}
        >
          새로고침
        </button>
      </div>
      {notice && <p role="status">{notice}</p>}
      <AdminCard title={`신고 ${rows.length}건`}>
        {state.loading ? (
          <p role="status">신고를 불러오고 있습니다.</p>
        ) : state.error ? (
          <p role="alert">신고를 불러오지 못했습니다.</p>
        ) : rows.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>대상</th>
                <th>사유</th>
                <th>작성자</th>
                <th>신고자</th>
                <th>상태</th>
                <th>접수일</th>
                <th>보기</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td>
                    {REPORT_TARGETS[item.targetType]}
                    {item.sameTargetCount > 1 &&
                      ` · 신고 ${item.sameTargetCount}건`}
                  </td>
                  <td>{reasonLabel(item.reason)}</td>
                  <td>{item.targetMemberName}</td>
                  <td>{item.reporterName}</td>
                  <td>
                    <span
                      className={`participation-badge is-${item.status.toLowerCase()}`}
                    >
                      {REPORT_STATUS[item.status]}
                    </span>
                  </td>
                  <td>{dateLabel(item.createdAt)}</td>
                  <td>
                    <button
                      className="admin-button admin-button--secondary"
                      aria-label={`신고 ${item.id} 보기`}
                      onClick={() => {
                        setSelectedId(item.id)
                        setError('')
                        setNote('')
                      }}
                    >
                      보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>조건에 맞는 신고가 없습니다.</p>
        )}
      </AdminCard>
      {selected && (
        <AdminCard
          title={`신고 #${selected.id} · ${REPORT_TARGETS[selected.targetType]}`}
        >
          <dl className="admin-report-detail">
            <dt>신고 당시 내용</dt>
            <dd className="admin-report-snapshot">{selected.targetSnapshot}</dd>
            <dt>작성자</dt>
            <dd>{selected.targetMemberName}</dd>
            <dt>사유</dt>
            <dd>
              {reasonLabel(selected.reason)}
              {selected.detail && ` · ${selected.detail}`}
            </dd>
            <dt>같은 대상 신고</dt>
            <dd>{selected.sameTargetCount}건</dd>
            {selected.status !== 'OPEN' && (
              <>
                <dt>처리 결과</dt>
                <dd>
                  {REPORT_STATUS[selected.status]} · {selected.resolution}
                  {selected.resolutionNote && ` · ${selected.resolutionNote}`}
                </dd>
              </>
            )}
          </dl>
          {selected.status === 'OPEN' && (
            <>
              <label className="admin-report-note">
                처리 메모 (작성자 알림에 함께 전달됩니다)
                <input
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="예) 욕설이 포함되어 가렸습니다."
                />
              </label>
              <div className="admin-report-actions">
                {reportActionsFor(selected.targetType).map(
                  ([code, label, help]) => (
                    <button
                      key={code}
                      className={`admin-button ${code === 'DISMISS' ? 'admin-button--secondary' : ''}`}
                      disabled={busy}
                      title={help}
                      onClick={() => act(code, label)}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
              <small>
                가리기·이용 정지는 같은 대상의 다른 신고도 함께 처리합니다. 이용
                정지는 &apos;회원&apos; 메뉴에서 해제할 수 있습니다.
              </small>
            </>
          )}
          {error && <p role="alert">{error}</p>}
        </AdminCard>
      )}
    </AdminLayout>
  )
}
