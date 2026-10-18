/**
 * 날짜를 서울 달력 기준 일수로 바꾸어 모집 시작·마감과 남은 날짜를 계산합니다.
 * 브라우저 시간대 차이가 카드의 일수 표시를 바꾸지 않도록 합니다.
 */
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
  return (
    Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) /
    DAY_MS
  )
}

// 기준일과 모집 시작/마감일을 비교하여 일수·시작 전·종료 상태를 함께 반환합니다.
export function campaignTiming(schedule, now = new Date()) {
  const today = dayNumber(now)
  const end = dayNumber(schedule?.recruitmentEndsAt)
  const start = dayNumber(schedule?.recruitmentStartsAt)
  return {
    daysLeft: end == null || today == null ? null : end - today,
    today: start != null && start === today,
  }
}
