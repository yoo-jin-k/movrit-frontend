/**
 * 업체 참여자 상세의 '활동·평가' 영역입니다.
 * - 참여자 활동 등급, 완료 횟수, 다른 브랜드 평가 평균, 유효 패널티 수를 보여줍니다.
 * - 완료한 참여자에게 1~5점 평가와 업체만 보는 메모를 남깁니다(다시 저장하면 고쳐집니다).
 * - 콘텐츠 마감이 지났는데 제출하지 않았거나(미제출), 확정한 방문 일시가 지났는데 방문하지 않았으면(노쇼) 패널티를 기록합니다.
 *   기록하면 그 참여는 취소되고 참여자에게 알림이 갑니다. 최근 90일 2회면 30일간 신청이 제한됩니다.
 * - 변경 이력: 고치기 전에는 완료가 아닌 참여에서 별점·메모 영역이 안내 없이 빠져 있었습니다.
 *   고친 후에는 '완료 후 별점 · 메모' 제목과 상태별 안내를 늘 보여 주고, 입력 칸은 완료 참여에만 엽니다.
 */
import { useEffect, useState } from 'react'
import {
  rateParticipant,
  readParticipantActivity,
  readVisitReservation,
  recordPenalty,
} from '../../api/participationApi'
import { readCampaign } from '../../api/campaignReadApi'
import {
  GRADE_STYLES,
  PENALTY_LABELS,
  penaltyOptions,
  stars,
} from './participationModel'
import {
  ratingAvailability,
  ratingChoiceLabel,
} from '../business/participantRatingModel'
import { useDialogUnsaved } from '../business/dialogUnsaved'

export default function ParticipantActivityPanel({ application, onChanged }) {
  const [data, setData] = useState(null)
  const [campaign, setCampaign] = useState(null)
  const [reservation, setReservation] = useState(null)
  const [rating, setRating] = useState(0)
  const [memo, setMemo] = useState('')
  const [penaltyType, setPenaltyType] = useState('')
  const [penaltyReason, setPenaltyReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    Promise.all([
      readParticipantActivity(application.id, signal),
      // 캠페인 일정은 미제출 판단에만 쓰므로, 못 불러와도 나머지는 보여줍니다.
      readCampaign(application.campaignId, signal).catch(() => null),
      application.fulfillmentType === 'VISIT'
        ? readVisitReservation(application.id, signal).catch(() => null)
        : null,
    ])
      .then(([activity, detail, visit]) => {
        setData(activity)
        setCampaign(detail)
        setReservation(visit)
        setRating(activity.myRating || 0)
        setMemo(activity.myMemo || '')
      })
      .catch(() => {
        if (!signal.aborted) setError('참여자 활동 정보를 불러오지 못했습니다.')
      })
    return () => controller.abort()
  }, [application.id, application.campaignId, application.fulfillmentType])

  // 저장하지 않은 별점·메모나 패널티 사유가 있으면 상세 창이 닫기 전에 확인합니다.
  const ratingEditable = ratingAvailability(application.status).editable
  useDialogUnsaved(
    (ratingEditable &&
      data &&
      (rating !== (data.myRating || 0) || memo !== (data.myMemo || ''))) ||
      Boolean(penaltyReason.trim()),
  )

  if (error && !data) return <p role="alert">{error}</p>
  if (!data) return <p role="status">참여자 활동 정보를 불러오고 있습니다.</p>
  const { activity } = data
  const options = penaltyOptions(application, campaign, reservation)
  const ratingState = ratingAvailability(application.status)

  const saveRating = async () => {
    if (busy) return
    if (rating < 1) {
      setError('별점을 1~5점 중에서 골라 주세요.')
      return
    }
    setBusy(true)
    setError('')
    try {
      setData(await rateParticipant(application.id, rating, memo))
      setNotice('평가를 저장했습니다.')
    } catch (failure) {
      setError(failure.response?.data?.detail || '평가를 저장하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const savePenalty = async () => {
    if (busy) return
    if (!penaltyReason.trim()) {
      setError('패널티 사유를 입력해 주세요.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await recordPenalty(application.id, penaltyType, penaltyReason.trim())
      setNotice(
        `${PENALTY_LABELS[penaltyType]} 패널티를 기록하고 참여를 취소했습니다. 참여자에게 알렸습니다.`,
      )
      setPenaltyType('')
      setPenaltyReason('')
      onChanged?.()
    } catch (failure) {
      setError(
        failure.response?.data?.detail || '패널티를 기록하지 못했습니다.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="participant-activity" aria-label="참여자 활동과 평가">
      <h3>활동 · 평가</h3>
      <p>
        <span className={`grade-badge is-${GRADE_STYLES[activity.grade]}`}>
          {activity.gradeLabel}
        </span>{' '}
        완료 {activity.completedCount}회 · 평가{' '}
        {activity.ratingAverage == null
          ? '없음'
          : `${activity.ratingAverage}점 (${activity.ratingCount}건)`}
        {activity.activePenaltyCount > 0 && (
          <strong className="participant-activity__warn">
            {' '}
            · 패널티 {activity.activePenaltyCount}회
          </strong>
        )}
      </p>
      {activity.restrictedUntil && (
        <p className="participant-activity__warn">
          패널티로 {String(activity.restrictedUntil).slice(0, 10)}까지 새 신청이
          제한된 참여자입니다.
        </p>
      )}
      <div className="participant-activity__rating">
        <h4 id={`rating-${application.id}`}>완료 후 별점 · 메모</h4>
        <p>{ratingState.hint}</p>
        {ratingState.editable && (
          <>
            <div
              className="rating-stars"
              role="radiogroup"
              aria-labelledby={`rating-${application.id}`}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value}점`}
                  className={value <= rating ? 'is-on' : ''}
                  onClick={() => setRating(value)}
                >
                  ★
                </button>
              ))}
            </div>
            <small>{ratingChoiceLabel(rating)}</small>
            <label>
              브랜드 메모 (참여자에게 보이지 않습니다)
              <textarea
                rows={2}
                maxLength={1000}
                value={memo}
                placeholder="예) 마감 전에 제출, 사진 품질이 좋음"
                onChange={(e) => setMemo(e.target.value)}
              />
            </label>
            <button type="button" disabled={busy} onClick={saveRating}>
              {data.myRating ? '평가 고치기' : '평가 저장'}
            </button>
            {data.myRating && (
              <small>저장한 평가: {stars(data.myRating)}</small>
            )}
          </>
        )}
      </div>
      {options.length > 0 && (
        <div className="participant-activity__penalty">
          <label>
            패널티 기록
            <select
              value={penaltyType}
              onChange={(e) => setPenaltyType(e.target.value)}
            >
              <option value="">선택하지 않음</option>
              {options.map((code) => (
                <option key={code} value={code}>
                  {PENALTY_LABELS[code]}
                </option>
              ))}
            </select>
          </label>
          {penaltyType && (
            <>
              <label>
                사유 (참여자에게 전달됩니다)
                <input
                  maxLength={500}
                  value={penaltyReason}
                  onChange={(e) => setPenaltyReason(e.target.value)}
                  placeholder="예) 마감일이 지나도록 콘텐츠를 제출하지 않았습니다."
                />
              </label>
              <p>
                기록하면 이 참여는 취소됩니다. 되돌리려면 운영자에게 문의해
                주세요.
              </p>
              <button type="button" disabled={busy} onClick={savePenalty}>
                {PENALTY_LABELS[penaltyType]} 패널티 기록
              </button>
            </>
          )}
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
    </section>
  )
}
