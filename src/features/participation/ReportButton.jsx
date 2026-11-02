/**
 * '신고' 버튼과 신고 양식입니다(커뮤니티 글·댓글, 채팅 메시지, 캠페인 콘텐츠).
 * 누르면 바로 아래에 사유 선택과 내용 입력이 펼쳐집니다. 접수되면 운영자가 확인하고, 처리 결과는 알림으로 받습니다.
 * 같은 내용은 한 번만 신고할 수 있습니다(서버 409 안내를 그대로 보여줍니다).
 */
import { useState } from 'react'
import { createReport } from '../../api/participationApi'
import {
  REPORT_REASONS,
  REPORT_TARGETS,
  reportError,
} from './participationModel'
import './participation.css'

export default function ReportButton({
  targetType,
  targetId,
  compact = false,
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const label = REPORT_TARGETS[targetType] || '내용'

  const submit = async () => {
    if (busy) return
    const problem = reportError({ reason, detail })
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError('')
    try {
      await createReport({
        targetType,
        targetId,
        reason,
        detail: detail.trim() || null,
      })
      setDone(true)
      setOpen(false)
    } catch (failure) {
      setError(failure.response?.data?.detail || '신고를 접수하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  if (done)
    return (
      <span className="report-done" role="status">
        신고 접수됨
      </span>
    )
  return (
    <span className={`report-button ${compact ? 'is-compact' : ''}`}>
      <button
        type="button"
        className="report-button__toggle"
        aria-expanded={open}
        aria-label={`${label} 신고`}
        onClick={() => setOpen((value) => !value)}
      >
        신고
      </button>
      {open && (
        <span
          className="report-form"
          role="group"
          aria-label={`${label} 신고 양식`}
        >
          <select
            aria-label="신고 사유"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="">사유 선택</option>
            {REPORT_REASONS.map(([code, text]) => (
              <option key={code} value={code}>
                {text}
              </option>
            ))}
          </select>
          <input
            aria-label="신고 내용"
            maxLength={1000}
            placeholder="자세한 내용 (선택)"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />
          <button type="button" disabled={busy} onClick={submit}>
            {busy ? '접수 중…' : '신고하기'}
          </button>
          {error && <em role="alert">{error}</em>}
        </span>
      )}
    </span>
  )
}
