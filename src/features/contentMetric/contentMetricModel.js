/**
 * 콘텐츠 성과 화면 규칙입니다: 숫자 표시, 입력 확인, 지난 기록과의 차이.
 */

export const MAX_METRIC = 1_000_000_000

export const METRIC_FIELDS = [
  ['viewCount', '조회수'],
  ['likeCount', '좋아요'],
  ['commentCount', '댓글'],
]

export const RECORDER_LABELS = { CREATOR: '참여자 입력', SELLER: '업체 입력' }

/** 큰 숫자를 짧게 보여 줍니다. 12,400 → '1.2만', 980 → '980' */
export function compactCount(value) {
  const number = Number(value) || 0
  if (number >= 100_000_000) return `${trim(number / 100_000_000)}억`
  if (number >= 10_000) return `${trim(number / 10_000)}만`
  return number.toLocaleString('ko-KR')
}

function trim(value) {
  return value >= 100
    ? String(Math.round(value))
    : String(Math.round(value * 10) / 10)
}

/**
 * 입력값을 서버 요청으로 바꿉니다. 콤마는 지우고, 빈칸·음수·소수·너무 큰 값은 오류 문구를 돌려줍니다.
 * 성공하면 { body }, 실패하면 { error }입니다. 날짜는 'YYYY-MM-DD' 문자열로 비교합니다.
 */
export function metricPayload(contentUrl, form, today, earliest) {
  const body = { contentUrl }
  for (const [key, label] of METRIC_FIELDS) {
    const text = String(form[key] ?? '')
      .replaceAll(',', '')
      .trim()
    if (!/^\d+$/.test(text))
      return { error: `${label} 칸에 0 이상의 숫자를 입력해 주세요.` }
    const number = Number(text)
    if (number > MAX_METRIC)
      return { error: `${label} 숫자가 너무 큽니다. 다시 확인해 주세요.` }
    body[key] = number
  }
  const day = form.measuredOn || today
  if (day > today) return { error: '오늘 이후 날짜는 기록할 수 없습니다.' }
  if (earliest && day < earliest)
    return {
      error: `콘텐츠를 제출한 날(${earliest}) 이후 날짜로 기록해 주세요.`,
    }
  body.measuredOn = day
  return { body }
}

/** 가장 최근 기록과 그 전 기록의 차이입니다. 비교할 기록이 없으면 null입니다. */
export function growth(history = []) {
  if (history.length < 2) return null
  const [latest, previous] = history
  return {
    days: Math.round(
      (Date.parse(`${latest.measuredOn}T00:00:00Z`) -
        Date.parse(`${previous.measuredOn}T00:00:00Z`)) /
        86400000,
    ),
    viewCount: latest.viewCount - previous.viewCount,
    likeCount: latest.likeCount - previous.likeCount,
    commentCount: latest.commentCount - previous.commentCount,
  }
}

/** 차이를 '+120'·'-3'·'0'으로 씁니다. */
export function signed(value) {
  if (value > 0) return `+${value.toLocaleString('ko-KR')}`
  return value.toLocaleString('ko-KR')
}

/** 참여율(좋아요+댓글 ÷ 조회수)을 소수 한 자리 %로 씁니다. 조회수가 0이면 '-'입니다. */
export function engagementRate(point) {
  if (!point || !point.viewCount) return '-'
  const rate = ((point.likeCount + point.commentCount) / point.viewCount) * 100
  return `${Math.round(rate * 10) / 10}%`
}

/** 오늘 날짜(로컬)를 'YYYY-MM-DD'로 씁니다. */
export function todayIso(now = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
