/**
 * 참여 운영 화면 규칙입니다(서버 규칙과 같은 기준을 화면에서 먼저 안내합니다).
 */

// ── 일괄 선정·미선정 ──
// 체크할 수 있는 신청: 브랜드 직접 선정 캠페인의 접수(SUBMITTED) 신청
export function bulkSelectable(application, selectionMode) {
  return application?.status === 'SUBMITTED' && selectionMode === 'BRAND_DIRECT'
}

// 일괄 처리 결과를 한 줄 안내로 바꿉니다.
export function bulkSummary(result, actionLabel) {
  const failures = (result?.results || []).filter((item) => !item.success)
  const head = `${actionLabel} ${result?.successCount ?? 0}건 완료`
  if (!failures.length) return `${head}했습니다.`
  const reasons = [
    ...new Set(failures.map((item) => item.message || '처리 실패')),
  ]
  return `${head}, ${failures.length}건은 처리하지 못했습니다(${reasons.join(' / ')}).`
}

// ── 방문 예약 ──
export const RESERVATION_STATUS = {
  REQUESTED: '확인 대기',
  CONFIRMED: '확정',
  REJECTED: '다시 정해 주세요',
}

// datetime-local 값(YYYY-MM-DDTHH:mm)을 확인합니다. now는 시험용입니다.
export function reservationError(
  { visitAt, partySize, note } = {},
  now = new Date(),
) {
  if (!visitAt) return '방문 희망 일시를 골라 주세요.'
  const at = new Date(visitAt)
  if (Number.isNaN(at.getTime())) return '방문 일시를 확인해 주세요.'
  if (at <= now) return '지금 이후의 방문 일시를 골라 주세요.'
  const size = Number(partySize)
  if (!Number.isInteger(size) || size < 1 || size > 10)
    return '방문 인원은 1~10명으로 입력해 주세요.'
  if (String(note || '').length > 500)
    return '요청 사항은 500자 이내로 입력해 주세요.'
  return ''
}

// 서버 시각(2026-11-05T12:30:00)을 '11월 5일 12:30'으로 보여줍니다.
export function visitLabel(value) {
  const match = String(value || '').match(
    /^\d{4}-(\d{2})-(\d{2})T(\d{2}):(\d{2})/,
  )
  return match
    ? `${Number(match[1])}월 ${Number(match[2])}일 ${match[3]}:${match[4]}`
    : '-'
}

// ── 활동 등급·패널티 ──
export const GRADE_STYLES = {
  SPROUT: 'sprout',
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  DIAMOND: 'diamond',
}
// CANCEL_LIMIT: 참여 취소(단순 취소·마감 지난 미제출 자동 취소)가 1년 안에 5회 쌓여 바뀐 패널티입니다.
// EXTENSION_LIMIT: 기간 연장(참여자 요청 승인·업체/운영자 직접 연장)이 1년 안에 10회 쌓여 바뀐 패널티로, 30일 동안 신청을 막습니다.
export const PENALTY_LABELS = {
  NO_SUBMIT: '미제출',
  NO_SHOW: '노쇼',
  CANCEL_LIMIT: '취소 5회 누적',
  EXTENSION_LIMIT: '연장 10회 누적',
}

// 다음 등급 안내 문구입니다.
export function nextGradeText(activity) {
  if (!activity) return ''
  if (!activity.nextGradeLabel) return '최고 등급입니다.'
  return `${activity.nextGradeLabel}까지 완료 ${activity.remainingToNext}회 남았습니다.`
}

// 업체가 지금 기록할 수 있는 패널티 종류입니다(서버 규칙과 같습니다).
// - 미제출: 진행 중(또는 수정 요청)이고 콘텐츠 마감이 지났을 때
// - 노쇼: 방문형 진행 중, 방문 확인 전, 확정한 방문 일시가 지났을 때
export function penaltyOptions(
  application,
  campaign,
  reservation,
  now = new Date(),
) {
  const options = []
  const inProgress = ['ACTIVE', 'REVISION_REQUESTED'].includes(
    application?.status,
  )
  const deadline = campaign?.contentSubmissionEndAt
    ? new Date(campaign.contentSubmissionEndAt)
    : null
  if (inProgress && deadline && deadline < now) options.push('NO_SUBMIT')
  if (
    application?.fulfillmentType === 'VISIT' &&
    application?.status === 'ACTIVE' &&
    !application?.experienceConfirmedAt &&
    reservation?.status === 'CONFIRMED' &&
    new Date(reservation.visitAt) < now
  )
    options.push('NO_SHOW')
  return options
}

// 점수 표시(★★★★☆)입니다.
export function stars(rating) {
  const value = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)))
  return '★'.repeat(value) + '☆'.repeat(5 - value)
}

// ── 신고 ──
export const REPORT_REASONS = [
  ['SPAM', '광고·도배'],
  ['ABUSE', '욕설·비방'],
  ['SEXUAL', '음란·선정성'],
  ['PRIVACY', '개인정보 노출'],
  ['FRAUD', '사기·거짓 정보'],
  ['OTHER', '기타'],
]
export const REPORT_TARGETS = {
  COMMUNITY_POST: '커뮤니티 글',
  COMMUNITY_COMMENT: '커뮤니티 댓글',
  CHAT_MESSAGE: '채팅 메시지',
  CAMPAIGN_CONTENT: '캠페인 콘텐츠',
}
export const REPORT_STATUS = {
  OPEN: '접수',
  RESOLVED: '조치 완료',
  DISMISSED: '기각',
}
export const REPORT_ACTIONS = [
  ['DISMISS', '기각', '위반이 아니면 그대로 둡니다.'],
  ['WARN', '경고', '작성자에게 경고 알림을 보냅니다.'],
  ['HIDE', '가리기', '글·댓글·메시지를 가리고 작성자에게 알립니다.'],
  ['SUSPEND', '이용 정지', '내용을 가리고 작성자 계정을 정지합니다.'],
]
export function reportError({ reason, detail } = {}) {
  if (!REPORT_REASONS.some(([code]) => code === reason))
    return '신고 사유를 골라 주세요.'
  if (reason === 'OTHER' && !String(detail || '').trim())
    return '기타 사유는 내용을 적어 주세요.'
  if (String(detail || '').length > 1000)
    return '내용은 1,000자 이내로 적어 주세요.'
  return ''
}
// 캠페인 콘텐츠는 외부 게시물이라 가릴 수 없습니다.
export const reportActionsFor = (targetType) =>
  REPORT_ACTIONS.filter(
    ([code]) => !(targetType === 'CAMPAIGN_CONTENT' && code === 'HIDE'),
  )
