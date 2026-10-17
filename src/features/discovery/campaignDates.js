const DAY_MS = 86_400_000
const koreanDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

// 사용자의 PC 시간대와 관계없이 상세 화면과 동일한 한국 날짜로 남은 일수를 계산합니다.
function dayNumber(value) {
  if (value == null || value === '') return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const parts = Object.fromEntries(
    koreanDate.formatToParts(date).map(({ type, value }) => [type, value]),
  )
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) / DAY_MS
}

export function campaignTiming(schedule, now = new Date()) {
  const today = dayNumber(now)
  const end = dayNumber(schedule?.recruitmentEndsAt)
  const start = dayNumber(schedule?.recruitmentStartsAt)
  return {
    daysLeft: end == null || today == null ? null : end - today,
    today: start != null && start === today,
  }
}
