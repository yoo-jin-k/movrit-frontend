/**
 * 같은 일정 모델로 기간 요약과 월별 달력을 구성합니다.
 * 기간이 겹치는 날짜는 여러 단계를 함께 표시하고 월 이동은 원본 일정 값을 변경하지 않습니다.
 */
import { useId, useState } from 'react'
import {
  monthGrid,
  periodsOnDay,
  schedulePeriods,
  seoulDay,
  shiftMonth,
} from './scheduleModel'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 요약과 달력이 같은 일정 원본을 사용하며 겹친 기간은 별도 색상과 텍스트로 모두 표시합니다.
export default function CampaignSchedule({
  schedule,
  defaultExpanded = false,
}) {
  const periods = schedulePeriods(schedule)
  const valid = periods.filter(
    (period) => !period.invalid && (period.start || period.end),
  )
  const first =
    valid.map((period) => period.start || period.end).sort()[0] ||
    seoulDay(new Date())
  const [display, setDisplay] = useState({
    year: Number(first.slice(0, 4)),
    month: Number(first.slice(5, 7)),
  })
  const [expanded, setExpanded] = useState(defaultExpanded)
  const calendarId = useId()
  const cells = monthGrid(display.year, display.month)
  const today = seoulDay(new Date())
  const move = (delta) =>
    setDisplay((current) => shiftMonth(current.year, current.month, delta))
  return (
    <section className="campaign-schedule" aria-label="캠페인 일정">
      <dl className="campaign-schedule__summary">
        {periods.map((period) => (
          <div key={period.id}>
            <dt>{period.label}</dt>
            <dd>{period.text}</dd>
          </div>
        ))}
      </dl>
      <p className="discovery-muted">한국 시간 기준</p>
      <button
        type="button"
        className="discovery-outline-button"
        aria-expanded={expanded}
        aria-controls={calendarId}
        onClick={() => setExpanded((value) => !value)}
      >
        일정 자세히 보기 {expanded ? '⌃' : '⌄'}
      </button>
      {expanded && (
        <div id={calendarId} className="campaign-calendar">
          {!valid.length ? (
            <p role="status">등록된 일정이 없습니다.</p>
          ) : (
            <>
              <div className="campaign-calendar__navigation">
                <button
                  type="button"
                  aria-label="이전 달"
                  onClick={() => move(-1)}
                >
                  ‹
                </button>
                <h3 aria-live="polite">
                  {display.year}년 {display.month}월
                </h3>
                <button
                  type="button"
                  aria-label="다음 달"
                  onClick={() => move(1)}
                >
                  ›
                </button>
              </div>
              <table>
                <caption className="campaign-calendar__caption">
                  {display.year}년 {display.month}월 캠페인 일정
                </caption>
                <thead>
                  <tr>
                    {WEEKDAYS.map((day) => (
                      <th scope="col" key={day}>
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: cells.length / 7 }, (_, row) => (
                    <tr key={row}>
                      {cells.slice(row * 7, row * 7 + 7).map((day, column) => (
                        <td key={day || `blank-${column}`}>
                          {day && (
                            <div
                              className="campaign-calendar__day"
                              aria-current={day === today ? 'date' : undefined}
                            >
                              <time dateTime={day}>
                                {Number(day.slice(-2))}
                              </time>
                              {periodsOnDay(periods, day).map((period) => (
                                <span
                                  key={period.id}
                                  className={`campaign-calendar__period is-${period.id}`}
                                  title={`${period.label} ${period.text}`}
                                  aria-label={`${day} ${period.label}`}
                                >
                                  {['selection', 'results'].includes(period.id)
                                    ? '◆'
                                    : '●'}
                                  <span className="campaign-calendar__sr">
                                    {period.label}
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="campaign-calendar__legend">
                {valid.map((period) => (
                  <li key={period.id}>
                    <span
                      className={`campaign-calendar__period is-${period.id}`}
                      aria-hidden="true"
                    >
                      {['selection', 'results'].includes(period.id) ? '◆' : '●'}
                    </span>
                    {period.label} <span>{period.text}</span>
                  </li>
                ))}
              </ul>
              {periods.some((period) => period.invalid) && (
                <p role="alert">
                  시작일과 종료일을 확인해야 하는 일정이 있습니다.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
