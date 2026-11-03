/**
 * 참여자 '내 활동 등급' 카드입니다(마이페이지).
 * - 완료 횟수로 정한 등급(새싹·브론즈·실버·골드·다이아)과 다음 등급까지 남은 횟수를 보여줍니다.
 * - 미제출·노쇼·취소 누적 패널티 기록과, 신청이 제한되었다면 언제까지인지 알려 줍니다.
 * - 참여 취소 횟수(1년 안, 5회가 되면 패널티 1회)를 함께 보여 줍니다.
 */
import { useEffect, useState } from 'react'
import { readMyActivity } from '../../api/participationApi'
import {
  GRADE_STYLES,
  PENALTY_LABELS,
  nextGradeText,
} from './participationModel'
import { cancelCountText } from './participationChangeModel'
import './participation.css'

export default function MyActivityCard() {
  const [activity, setActivity] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    readMyActivity(controller.signal)
      .then(setActivity)
      .catch(() => {
        if (!controller.signal.aborted)
          setError('활동 등급을 불러오지 못했습니다.')
      })
    return () => controller.abort()
  }, [])
  if (error) return <p role="alert">{error}</p>
  if (!activity) return null
  return (
    <section className="my-activity" aria-label="내 활동 등급">
      <div className="my-activity__head">
        <span className={`grade-badge is-${GRADE_STYLES[activity.grade]}`}>
          {activity.gradeLabel}
        </span>
        <div>
          <strong>완료 {activity.completedCount}회</strong>
          <small>{nextGradeText(activity)}</small>
        </div>
      </div>
      {activity.restrictedUntil && (
        <p className="participant-activity__warn" role="status">
          패널티가 쌓여 {String(activity.restrictedUntil).slice(0, 10)}까지 새
          캠페인에 신청할 수 없습니다.
        </p>
      )}
      {activity.cancelCount != null && (
        <p className="my-activity__cancel">
          {cancelCountText(activity.cancelCount, activity.cancelLimit)}
        </p>
      )}
      {activity.penalties?.length > 0 && (
        <details>
          <summary>패널티 기록 {activity.penalties.length}건</summary>
          <ul>
            {activity.penalties.map((item) => (
              <li key={item.id}>
                {PENALTY_LABELS[item.type]} · {item.campaignTitle || '캠페인'} ·{' '}
                {String(item.createdAt).slice(0, 10)}
                {!item.active && ' (운영자가 취소함)'}
                <br />
                <small>{item.reason}</small>
              </li>
            ))}
          </ul>
        </details>
      )}
      <small className="my-activity__rule">
        등급은 완료한 캠페인 수로 정해집니다(브론즈 1회·실버 3회·골드 6회·다이아
        10회). 최근 90일 동안 패널티가 2회 쌓이면 30일 동안 신청할 수 없습니다.
      </small>
    </section>
  )
}
