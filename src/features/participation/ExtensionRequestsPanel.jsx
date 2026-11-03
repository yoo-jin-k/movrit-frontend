/**
 * 업체 '참여자 관리'의 기간 연장 요청 목록입니다.
 * - 참여자가 보낸 7·14일 연장 요청을 승인하면 그 신청의 콘텐츠 마감만 늦춰지고, 반려하면 사유가 참여자에게 갑니다.
 * - 캠페인을 골라 둔 경우 그 캠페인 요청만 보여 줍니다. 요청이 하나도 없으면 영역을 숨깁니다.
 */
import { useEffect, useState } from 'react'
import {
  decideExtension,
  readSellerExtensions,
} from '../../api/participationChangeApi'
import { workspaceTime } from '../membership/campaignWorkspaceModel'
import { REQUEST_STATUS } from './participationChangeModel'
import './participation.css'

export default function ExtensionRequestsPanel({ campaignId, onChanged }) {
  const [items, setItems] = useState(null)
  const [revision, setRevision] = useState(0)
  const [rejectingId, setRejectingId] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    readSellerExtensions(controller.signal)
      .then(setItems)
      .catch(() => {
        if (!controller.signal.aborted) setItems([])
      })
    return () => controller.abort()
  }, [revision])

  const shown = (items || []).filter(
    (item) => !campaignId || String(item.campaignId) === String(campaignId),
  )
  if (!shown.length) return null

  const decide = async (item, approve) => {
    if (busy) return
    if (!approve && !note.trim()) {
      setError('반려 사유를 입력해 주세요.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await decideExtension(item.applicationId, approve, approve ? null : note)
      setNotice(
        approve
          ? `${item.participantNickname}님의 마감을 ${item.days}일 늘렸습니다.`
          : `${item.participantNickname}님에게 반려 사유를 보냈습니다.`,
      )
      setRejectingId(null)
      setNote('')
      setRevision((value) => value + 1)
      onChanged?.()
    } catch (failure) {
      setError(failure.response?.data?.detail || '처리하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const waiting = shown.filter((item) => item.status === 'REQUESTED').length
  return (
    <section
      className="business-panel extension-requests"
      aria-label="기간 연장 요청"
    >
      <h2>기간 연장 요청 {waiting ? `${waiting}건 대기` : ''}</h2>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
      <ul>
        {shown.map((item) => (
          <li key={item.applicationId}>
            <div>
              <strong>{item.participantNickname || '참여자'}</strong> ·{' '}
              {item.campaignTitle} · {item.days}일 연장{' '}
              <span
                className={`participation-badge is-${item.status.toLowerCase()}`}
              >
                {REQUEST_STATUS[item.status]}
              </span>
              <p>{item.reason}</p>
              <small>
                마감 {workspaceTime(item.previousDeadline)} →{' '}
                {workspaceTime(item.extendedDeadline)}
                {item.decisionNote && ` · ${item.decisionNote}`}
              </small>
            </div>
            {item.status === 'REQUESTED' && (
              <div className="extension-requests__actions">
                {rejectingId === item.applicationId ? (
                  <>
                    <input
                      aria-label="연장 반려 사유"
                      maxLength={500}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="반려 사유"
                    />
                    <button disabled={busy} onClick={() => decide(item, false)}>
                      반려 보내기
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => {
                        setRejectingId(null)
                        setNote('')
                      }}
                    >
                      돌아가기
                    </button>
                  </>
                ) : (
                  <>
                    <button disabled={busy} onClick={() => decide(item, true)}>
                      연장 승인
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => {
                        setRejectingId(item.applicationId)
                        setNote('')
                        setError('')
                      }}
                    >
                      반려
                    </button>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
