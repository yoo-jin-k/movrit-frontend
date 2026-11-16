/**
 * 방문형 캠페인의 방문 예약 영역입니다.
 * - 참여자(mode="participant"): 선정되어 참여 중이면 방문 희망 일시·인원·요청 사항을 보내고, 반려되면 다른 일시로 다시 요청합니다.
 *   확정 뒤에도 방문 완료 확인 전이면 일시를 바꿔 다시 요청할 수 있습니다.
 * - 업체(mode="seller"): 요청을 확정하거나 사유와 함께 반려합니다. 결과는 참여자에게 알림으로 갑니다.
 */
import { useEffect, useState } from 'react'
import {
  confirmVisitReservation,
  readVisitReservation,
  rejectVisitReservation,
  requestVisitReservation,
} from '../../api/participationApi'
import {
  RESERVATION_STATUS,
  reservationError,
  visitLabel,
} from './participationModel'

export default function VisitReservationPanel({ application, mode }) {
  const [reservation, setReservation] = useState(undefined)
  const [editing, setEditing] = useState(false)
  const [visitAt, setVisitAt] = useState('')
  const [partySize, setPartySize] = useState('1')
  const [note, setNote] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    readVisitReservation(application.id, controller.signal)
      .then(setReservation)
      .catch(() => {
        if (!controller.signal.aborted)
          setError('방문 예약을 불러오지 못했습니다.')
      })
    return () => controller.abort()
  }, [application.id])

  const participant = mode === 'participant'
  // 참여자가 예약을 (다시) 요청할 수 있는 상태: 방문형 진행 중, 방문 완료 확인 전
  const canRequest =
    participant &&
    application.status === 'ACTIVE' &&
    !application.experienceConfirmedAt
  const showForm =
    canRequest &&
    (reservation === null || reservation?.status === 'REJECTED' || editing)

  const run = async (task, done) => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      setReservation(await task())
      setNotice(done)
      setEditing(false)
      setRejecting(false)
      setReason('')
    } catch (failure) {
      setError(
        failure.response?.data?.detail ||
          '처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setBusy(false)
    }
  }

  const submit = (event) => {
    event.preventDefault()
    const problem = reservationError({ visitAt, partySize, note })
    if (problem) {
      setError(problem)
      return
    }
    run(
      () =>
        requestVisitReservation(application.id, {
          visitAt: `${visitAt}:00`,
          partySize: Number(partySize),
          note: note.trim() || null,
        }),
      '방문 예약을 요청했습니다. 브랜드가 확정하면 알림으로 알려 드립니다.',
    )
  }

  return (
    <section className="visit-reservation" aria-label="방문 예약">
      <h3>방문 예약</h3>
      {reservation === undefined && !error && (
        <p role="status">방문 예약을 확인하고 있습니다.</p>
      )}
      {reservation === null && !participant && (
        <p>참여자가 아직 방문 일시를 요청하지 않았습니다.</p>
      )}
      {reservation && (
        <div className="visit-reservation__summary">
          <p>
            <span
              className={`participation-badge is-${reservation.status.toLowerCase()}`}
            >
              {RESERVATION_STATUS[reservation.status]}
            </span>{' '}
            <strong>{visitLabel(reservation.visitAt)}</strong> ·{' '}
            {reservation.partySize}명
          </p>
          {reservation.requestNote && (
            <p>요청 사항: {reservation.requestNote}</p>
          )}
          {reservation.status === 'REJECTED' && (
            <p className="visit-reservation__reject">
              반려 사유: {reservation.rejectReason}
            </p>
          )}
        </div>
      )}
      {/* 업체: 확인 대기 예약을 확정하거나 반려합니다. */}
      {!participant && reservation?.status === 'REQUESTED' && (
        <div className="visit-reservation__actions">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(
                () => confirmVisitReservation(application.id),
                '방문 예약을 확정하고 참여자에게 알렸습니다.',
              )
            }
          >
            예약 확정
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setRejecting((value) => !value)}
          >
            다른 일시 요청
          </button>
          {rejecting && (
            <div className="visit-reservation__reject-form">
              <label>
                반려 사유
                <input
                  maxLength={500}
                  value={reason}
                  placeholder="예) 그 시간은 예약이 꽉 찼습니다. 평일 오후로 부탁드립니다."
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  reason.trim()
                    ? run(
                        () =>
                          rejectVisitReservation(application.id, reason.trim()),
                        '참여자에게 다른 일시를 요청했습니다.',
                      )
                    : setError('반려 사유를 입력해 주세요.')
                }
              >
                반려 보내기
              </button>
            </div>
          )}
        </div>
      )}
      {canRequest && reservation?.status === 'CONFIRMED' && !editing && (
        <button type="button" onClick={() => setEditing(true)}>
          방문 일시 바꾸기
        </button>
      )}
      {canRequest && reservation?.status === 'REQUESTED' && !editing && (
        <button type="button" onClick={() => setEditing(true)}>
          요청 일시 고치기
        </button>
      )}
      {showForm && (
        <form className="visit-reservation__form" onSubmit={submit}>
          <label>
            방문 희망 일시
            <input
              type="datetime-local"
              required
              value={visitAt}
              onChange={(e) => setVisitAt(e.target.value)}
            />
          </label>
          <label>
            인원
            <input
              type="number"
              min={1}
              max={10}
              required
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
            />
          </label>
          <label className="visit-reservation__wide">
            요청 사항 (선택)
            <input
              maxLength={500}
              value={note}
              placeholder="예) 창가 자리 부탁드립니다."
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <div className="visit-reservation__actions">
            <button type="submit" disabled={busy}>
              {busy ? '보내는 중…' : '방문 예약 요청'}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(false)}>
                취소
              </button>
            )}
          </div>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
    </section>
  )
}
