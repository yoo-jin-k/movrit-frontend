/**
 * 참여자 상세의 '기간 직접 연장' 영역입니다(업체 참여자 관리·운영자 캠페인 참여자 상세 공용).
 * - 참여자 한 명에게 사정이 있을 때 업체나 운영자가 1~30일을 사유와 함께 직접 늘립니다. 횟수 제한은 없습니다.
 * - 늘리면 이 신청의 체험 기간과 콘텐츠 마감이 함께 늘어나고(캠페인 일정은 그대로), 참여자에게 사유와 함께 알림이 갑니다.
 * - 모든 연장은 기록되어 이 참여자의 연장 횟수(최근 1년·전체)로 보이고, 운영자 회원 상세에서도 확인합니다.
 * - 참여자가 보낸 연장 요청이 확인 대기 중이면 그 요청을 먼저 처리해야 합니다.
 */
import { useEffect, useState } from 'react'
import {
  directExtend,
  readApplicationExtensions,
} from '../../api/participationChangeApi'
import { workspaceTime } from '../membership/campaignWorkspaceModel'
import {
  DIRECT_EXTENSION_MAX,
  DIRECT_EXTENSION_MIN,
  EXTENSION_SOURCE,
  directExtensionError,
  extensionCountText,
} from './participationChangeModel'
import './participation.css'

export default function DirectExtensionPanel({
  applicationId,
  admin = false,
  onChanged,
}) {
  const [data, setData] = useState(null)
  const [revision, setRevision] = useState(0)
  const [days, setDays] = useState('3')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    readApplicationExtensions(applicationId, controller.signal)
      .then(setData)
      .catch(() => {
        if (!controller.signal.aborted) setData(false)
      })
    return () => controller.abort()
  }, [applicationId, revision])

  // 권한이 없거나 불러오지 못하면 영역을 숨깁니다.
  if (!data) return null
  // 진행이 끝났고 연장한 적도 없으면 보여 줄 내용이 없습니다.
  if (!data.canExtend && !data.pendingRequest && !data.logs.length) return null

  const submit = async (event) => {
    event.preventDefault()
    if (busy) return
    const problem = directExtensionError(days, reason)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError('')
    try {
      const next = await directExtend(applicationId, days, reason)
      setData(next)
      setNotice(
        `기간을 ${days}일 늘렸습니다. 콘텐츠 마감은 ${workspaceTime(next.contentDeadline)}입니다.`,
      )
      setReason('')
      onChanged?.()
    } catch (failure) {
      setError(failure.response?.data?.detail || '기간을 늘리지 못했습니다.')
      setRevision((value) => value + 1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className={`direct-extension${admin ? ' direct-extension--admin' : ''}`}
      aria-label="기간 직접 연장"
    >
      <h3>기간 직접 연장</h3>
      <p>
        이 참여자 연장 횟수:{' '}
        <strong>
          {extensionCountText(
            data.participantYearCount,
            data.participantTotalCount,
          )}
        </strong>
        <br />
        <small>
          참여자 요청 승인과 업체·운영자 직접 연장을 모두 셉니다. 잦은 연장은
          운영자가 회원 정보에서 확인합니다.
        </small>
      </p>
      <p>
        체험 종료 {workspaceTime(data.experienceEnd) || '미정'} · 콘텐츠 마감{' '}
        {workspaceTime(data.contentDeadline) || '미정'}
      </p>
      {notice && <p role="status">{notice}</p>}
      {data.pendingRequest && (
        <p className="direct-extension__hint">
          참여자가 보낸 연장 요청이 확인 대기 중입니다. 요청을 먼저 승인하거나
          반려해 주세요.
        </p>
      )}
      {data.canExtend && (
        <form className="direct-extension__form" onSubmit={submit}>
          <label>
            늘릴 일수
            <input
              type="number"
              min={DIRECT_EXTENSION_MIN}
              max={DIRECT_EXTENSION_MAX}
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </label>
          <label className="direct-extension__wide">
            사유(참여자에게도 보입니다)
            <textarea
              maxLength={500}
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예) 참여자 개인 사정으로 촬영 일정을 조정했습니다."
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={busy}>
            {busy ? '처리 중...' : '체험·마감 함께 늘리기'}
          </button>
        </form>
      )}
      {!data.canExtend && error && <p role="alert">{error}</p>}
      {data.logs.length > 0 && (
        <ul className="direct-extension__logs" aria-label="이 신청의 연장 기록">
          {data.logs.map((log) => (
            <li key={log.id}>
              <strong>{log.days}일</strong> · {EXTENSION_SOURCE[log.source]}
              {log.extendedByNickname && ` (${log.extendedByNickname})`} ·{' '}
              {workspaceTime(log.createdAt)}
              <br />
              <small>
                마감 {workspaceTime(log.previousDeadline)} →{' '}
                {workspaceTime(log.newDeadline)} · {log.reason}
              </small>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
