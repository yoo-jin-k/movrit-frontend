// 오프셋 없는 실제 API 시각은 계약에 따라 서울 시각으로 해석합니다.
export function seoulInstant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return null
  const parsed = new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}+09:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function seoulDay(value) {
  const date = value instanceof Date ? value : seoulInstant(value)
  if (!date || Number.isNaN(date.getTime())) return null
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}

// 시작일이 없는 콘텐츠 등록 일정은 마감일 한 점으로 표시하며 다른 단계의 시작일을 빌리지 않습니다.
export function schedulePeriods(schedule) {
  const fields = [
    ['recruitment', '신청기간', 'recruitmentStartsAt', 'recruitmentEndsAt'],
    ['selection', '선정발표', null, 'selectionDueAt'],
    ['experience', '체험기간', 'experienceStartsAt', 'experienceEndsAt'],
    ['submission', '콘텐츠 등록기간', 'submissionStartsAt', 'submissionDueAt'],
    ['results', '결과발표', null, 'resultsDueAt'],
  ]
  return fields.map(([id, label, startField, endField]) => {
    const start = startField ? seoulDay(schedule?.[startField]) : null
    const end = seoulDay(
      startField && schedule?.endExclusive
        ? periodEndInstant(schedule?.[endField])
        : schedule?.[endField],
    )
    const invalid = Boolean(start && end && start > end)
    const singleLabel = ['selection', 'results'].includes(id)
      ? label
      : start && !end
        ? `${label.replace('기간', '')} 시작`
        : !start && end
          ? `${label.replace('기간', '')} 마감`
          : label
    return {
      id,
      label: singleLabel,
      start,
      end,
      invalid,
      text: invalid
        ? '일정 확인 필요'
        : start && end
          ? `${shortDay(start)}~${shortDay(end)}`
          : start || end
            ? shortDay(start || end)
            : '미구성',
    }
  })
}
function shortDay(day) {
  return day.slice(5).replace('-', '.')
}
export function periodsOnDay(periods, day) {
  return periods.filter(
    (period) =>
      !period.invalid &&
      (period.start || period.end) &&
      day >= (period.start || period.end) &&
      day <= (period.end || period.start),
  )
}
export function monthGrid(year, month) {
  const offset = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1
    return day < 1 || day > count
      ? null
      : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  })
}
export function shiftMonth(year, month, delta) {
  const date = new Date(Date.UTC(year, month - 1 + delta, 1))
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 }
}
export function periodHasEnded(end, now = new Date()) {
  const instant = seoulInstant(end)
  return instant ? now.getTime() >= instant.getTime() : false
}

// 기간 종료는 제외 경계입니다. 달력과 카드에는 마지막으로 포함되는 날짜를 동일하게 사용합니다.
export function periodEndInstant(value) {
  const instant = seoulInstant(value)
  return instant ? new Date(instant.getTime() - 1) : null
}

// 실제 상세 DTO에 정의된 단계만 매핑합니다. 없는 단계는 다른 날짜로 대체하지 않습니다.
export function liveCampaignSchedule(dto) {
  return {
    recruitmentStartsAt: dto.startAt ?? null,
    recruitmentEndsAt: dto.endAt ?? null,
    selectionDueAt: dto.selectionAnnouncedAt ?? null,
    experienceStartsAt: dto.experienceStartAt ?? null,
    experienceEndsAt: dto.experienceEndAt ?? null,
    submissionStartsAt: dto.contentSubmissionStartAt ?? null,
    submissionDueAt: dto.contentSubmissionEndAt ?? null,
    resultsDueAt: dto.resultsAnnouncedAt ?? null,
    endExclusive: true,
    version: dto.scheduleVersion ?? null,
  }
}
