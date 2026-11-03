/**
 * '내 캠페인'의 월 달력입니다. 신청한 모든 캠페인의 선정 발표·체험 시작·콘텐츠 마감·결과 발표를 한 달 단위로 보여 줍니다.
 * 기간 연장이 승인된 신청은 연장된 마감을 씁니다. 날짜의 일정을 누르면 해당 캠페인 작업을 엽니다.
 */
import { useMemo, useState } from 'react'
import { monthGrid, seoulDay, shiftMonth } from '../discovery/scheduleModel'
import {
  calendarEvents,
  eventsOnDay,
  initialCalendarMonth,
} from './participationChangeModel'
import './participation.css'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function MyCampaignCalendar({ items, onOpen }) {
  const events = useMemo(() => calendarEvents(items), [items])
  const [view, setView] = useState(() => initialCalendarMonth(events))
  const today = seoulDay(new Date())
  const cells = monthGrid(view.year, view.month)
  const weeks = Array.from({ length: cells.length / 7 }, (_, index) =>
    cells.slice(index * 7, index * 7 + 7),
  )
  const monthEvents = events.filter((event) =>
    event.day.startsWith(`${view.year}-${String(view.month).padStart(2, '0')}`),
  )
  return (
    <section className="my-calendar" aria-label="내 캠페인 달력">
      <div className="my-calendar__head">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => setView(shiftMonth(view.year, view.month, -1))}
        >
          ‹
        </button>
        <h2>
          {view.year}년 {view.month}월
        </h2>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => setView(shiftMonth(view.year, view.month, 1))}
        >
          ›
        </button>
      </div>
      <table
        className="my-calendar__grid"
        role="grid"
        aria-label={`${view.year}년 ${view.month}월 달력`}
      >
        <thead>
          <tr>
            {WEEKDAYS.map((name) => (
              <th key={name} scope="col">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, index) => (
            <tr key={index}>
              {week.map((day, column) => (
                <td
                  key={day || `blank-${index}-${column}`}
                  className={day === today ? 'is-today' : undefined}
                >
                  {day && (
                    <>
                      <span className="my-calendar__date">
                        {Number(day.slice(8))}
                      </span>
                      {eventsOnDay(events, day).map((event) => (
                        <button
                          type="button"
                          key={`${event.applicationId}-${event.stage}`}
                          className={`my-calendar__event is-${event.stage}`}
                          title={`${event.title} · ${event.label}`}
                          onClick={() => onOpen(event.applicationId)}
                        >
                          <b>{event.label}</b> {event.title}
                        </button>
                      ))}
                    </>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* 좁은 화면에서는 이 달의 일정을 목록으로도 보여 줍니다. */}
      <ul className="my-calendar__list">
        {monthEvents.length ? (
          monthEvents.map((event) => (
            <li key={`${event.applicationId}-${event.stage}`}>
              <button type="button" onClick={() => onOpen(event.applicationId)}>
                <span>{event.day.slice(5).replace('-', '.')}</span>
                <b>{event.label}</b>
                {event.extended && <small>(연장)</small>} {event.title}
              </button>
            </li>
          ))
        ) : (
          <li>이 달에는 일정이 없습니다.</li>
        )}
      </ul>
    </section>
  )
}
