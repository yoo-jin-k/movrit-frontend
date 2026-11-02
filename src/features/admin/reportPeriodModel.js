/**
 * 운영 리포트 기간 선택 규칙입니다. 날짜는 모두 'YYYY-MM-DD'(한국 시간 기준 달력 날짜)로 다룹니다.
 */

export const REPORT_PRESETS = [
  ['7d', '최근 7일'],
  ['30d', '최근 30일'],
  ['90d', '최근 90일'],
  ['month', '이번 달'],
  ['all', '전체 기간'],
  ['custom', '직접 고르기'],
]

export const MAX_REPORT_DAYS = 366

/** Date → 'YYYY-MM-DD'(로컬 날짜). */
export function isoDate(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 프리셋을 시작일·종료일로 바꿉니다. 전체 기간은 둘 다 빈 값입니다. */
export function presetRange(preset, today = new Date()) {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const days = { '7d': 7, '30d': 30, '90d': 90 }[preset]
  if (days) {
    const start = new Date(end)
    start.setDate(start.getDate() - (days - 1))
    return { from: isoDate(start), to: isoDate(end) }
  }
  if (preset === 'month') {
    return {
      from: isoDate(new Date(end.getFullYear(), end.getMonth(), 1)),
      to: isoDate(end),
    }
  }
  return { from: '', to: '' }
}

/** 직접 고른 기간을 확인합니다. 문제가 없으면 빈 문자열입니다(서버와 같은 규칙). */
export function rangeError({ from, to }) {
  if (!from && !to) return ''
  if (!from || !to) return '시작일과 종료일을 모두 골라 주세요.'
  if (from > to) return '시작일이 종료일보다 늦습니다.'
  const days =
    Math.round(
      (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
        86400000,
    ) + 1
  if (days > MAX_REPORT_DAYS) return '기간은 1년(366일) 안으로 골라 주세요.'
  return ''
}

/** 리포트 API 주소입니다. 기간이 없으면 전체 기간입니다. */
export function reportPath({ from, to }) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const query = params.toString()
  return `/admin/reports${query ? `?${query}` : ''}`
}

/** 화면 위쪽에 보여 줄 기간 문구입니다. */
export function rangeLabel(report) {
  if (!report?.from) return '전체 기간'
  return report.from === report.to
    ? report.from
    : `${report.from} ~ ${report.to}`
}

/** 날짜별 추이 합계입니다(표 맨 아래 줄). */
export function dailyTotals(rows = []) {
  return rows.reduce(
    (sum, row) => ({
      signups: sum.signups + row.signups,
      applications: sum.applications + row.applications,
      contents: sum.contents + row.contents,
      completed: sum.completed + row.completed,
    }),
    { signups: 0, applications: 0, contents: 0, completed: 0 },
  )
}
