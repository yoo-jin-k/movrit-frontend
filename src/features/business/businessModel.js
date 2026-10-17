// 서버가 제공한 상태만 번역합니다. 알 수 없는 상태를 완료로 취급하지 않습니다.
export const statusNames = {
  SUBMITTED: '접수',
  SELECTED: '선정 · 수락 대기',
  REJECTED: '미선정',
  ACTIVE: '참여 중',
  CONTENT_SUBMITTED: '콘텐츠 제출',
  REVISION_REQUESTED: '수정 요청',
  BRAND_APPROVED: '업체 검토 완료 · 최종 승인 대기',
  APPROVED: '승인 완료',
  COMPLETED: '완료',
  CANCELLED: '취소',
  PENDING: '대기',
  ANSWERED: '답변 완료',
  CLOSED: '종료',
}
export function safeContentUrl(value) {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}
export function reviewPayload(item, comment, action) {
  if (!Number.isSafeInteger(item.version) || item.version < 0)
    throw new Error('최신 콘텐츠 버전을 확인한 후 검토해 주세요.')
  const value = comment.trim()
  if (action === 'request-revision' && !value)
    throw new Error('수정 요청 의견을 입력해 주세요.')
  if (value.length > 2000)
    throw new Error('검토 의견은 2,000자 이내로 입력해 주세요.')
  return { comment: value || null, expectedVersion: item.version }
}
export function dateLabel(value) {
  if (!value) return '일정 미제공'
  const date = new Date(
    /(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}+09:00`,
  )
  return Number.isNaN(date.getTime())
    ? '일정 확인 필요'
    : new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
}

export function upcomingCampaigns(campaigns, now = Date.now()) {
  const timestamp = (value) =>
    value
      ? new Date(
          /(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}+09:00`,
        ).getTime()
      : NaN
  return campaigns
    .filter((c) => timestamp(c.endAt) > now)
    .sort((a, b) => timestamp(a.endAt) - timestamp(b.endAt))
    .slice(0, 4)
}
