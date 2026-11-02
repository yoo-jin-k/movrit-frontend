/**
 * 캠페인 일정(요약 목록 + 월 달력)입니다. 상세 화면 요약 카드와 '일정' 탭이 함께 씁니다.
 *
 * - 요약: 신청기간·선정발표·체험기간·콘텐츠 등록기간·결과발표를 한 줄씩 보여 줍니다.
 * - 달력: '캘린더 보기'를 누르면 펼칩니다(defaultExpanded면 처음부터 펼침).
 *   신청기간은 날짜 칸 배경으로, 나머지 단계는 날짜 아래 색 점으로 표시합니다.
 *   한 날짜에 여러 단계가 겹치면 점을 모두 보여 주고, 화면 읽기용으로 단계 이름을 함께 넣습니다.
 * - 같은 일정 원본(scheduleModel)으로 요약과 달력을 만들고, 달 이동은 원본 값을 바꾸지 않습니다.
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

export default function CampaignSchedule({
  schedule,
  defaultExpanded = false,
}) {
  const periods = schedulePeriods(schedule)
  const valid = periods.filter(
    (period) => !period.invalid && (period.start || period.end),
  )
  // 달력은 가장 이른 일정이 있는 달부터 보여 줍니다.
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
      <ol className="campaign-schedule__summary">
        {periods.map((period) => (
          <li key={period.id}>
            <span
              className={`campaign-schedule__dot is-${period.id}`}
              aria-hidden="true"
            />
            <span>{period.label}</span>
            <strong>{period.text}</strong>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="campaign-schedule__toggle"
        aria-expanded={expanded}
        aria-controls={calendarId}
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? '캘린더 접기 ▴' : '캘린더 보기 ▾'}
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
                <caption className="visually-hidden">
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
                      {cells.slice(row * 7, row * 7 + 7).map((day, column) => {
                        if (!day) return <td key={`blank-${column}`} />
                        const onDay = periodsOnDay(periods, day)
                        // 신청기간은 배경으로 칠하고, 나머지 단계는 점으로 표시합니다.
                        const recruiting = onDay.some(
                          (period) => period.id === 'recruitment',
                        )
                        const dots = onDay.filter(
                          (period) => period.id !== 'recruitment',
                        )
                        return (
                          <td key={day}>
                            <div
                              className={`campaign-calendar__day${recruiting ? ' is-recruitment' : ''}`}
                              aria-current={day === today ? 'date' : undefined}
                            >
                              <time dateTime={day}>
                                {Number(day.slice(-2))}
                              </time>
                              {dots.length > 0 && (
                                <span className="campaign-calendar__dots">
                                  {dots.map((period) => (
                                    <span
                                      key={period.id}
                                      className={`campaign-schedule__dot is-${period.id}`}
                                      title={`${period.label} ${period.text}`}
                                    />
                                  ))}
                                </span>
                              )}
                              {onDay.length > 0 && (
                                <span className="visually-hidden">
                                  {onDay
                                    .map((period) => period.label)
                                    .join(', ')}
                                </span>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="campaign-calendar__legend">
                {valid.map((period) => (
                  <li key={period.id}>
                    <span
                      className={`campaign-schedule__dot is-${period.id}`}
                      aria-hidden="true"
                    />
                    {period.label}
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
      <p className="campaign-schedule__note">한국 시간 기준</p>
    </section>
  )
}
