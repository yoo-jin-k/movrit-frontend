/**
 * 운영자 관리 화면에서 함께 쓰는 표시 규칙입니다(화면 없이 테스트할 수 있도록 분리).
 *
 * - 서버의 상태 코드를 한국어 이름과 색(tone)으로 바꿉니다.
 * - 금액·날짜를 한국 형식으로 표시합니다.
 * - 목록 검색어·상태 칩 필터를 적용합니다.
 */

// 서버 상태 코드 → 화면 이름입니다. 여러 기능의 상태 코드를 한곳에 모았습니다.
export const STATUS_LABELS = {
  // 회원
  ACTIVE: '정상',
  INACTIVE: '휴면',
  SUSPENDED: '정지',
  WITHDRAWN: '탈퇴',
  // 업체 심사
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '반려',
  // 프리오더
  DRAFT: '초안',
  SCHEDULED: '판매 예약',
  OPEN: '판매 중',
  CLOSED: '마감',
  SUCCESS: '성공',
  FAILED: '실패',
  PRODUCTION: '생산 중',
  SHIPPING: '배송 단계',
  COMPLETED: '완료',
  CANCELLED: '취소',
  // 주문·결제·배송
  PENDING_PAYMENT: '결제 대기',
  PAID: '결제 완료',
  PREPARING: '배송 준비',
  SHIPPED: '발송',
  DELIVERED: '배송 완료',
  REFUNDED: '환불',
  READY: '대기',
  RETURNED: '반품',
  // 정산
  CONFIRMED: '확정',
  // 캠페인 신청·콘텐츠
  SUBMITTED: '접수',
  SELECTED: '선정',
  CONTENT_SUBMITTED: '콘텐츠 제출',
  REVISION_REQUESTED: '수정 요청',
  BRAND_APPROVED: '업체 검토 완료',
  // 협업
  PROPOSED: '제안',
  ACCEPTED: '수락',
  DECLINED: '거절',
  ENDED: '종료',
  // 지표 확인
  VERIFIED: '확인됨',
  UNVERIFIED: '미확인',
}

// 같은 코드라도 기능마다 뜻이 달라 따로 둡니다(예: ACTIVE는 회원 '정상', 신청 '참여 중').
export const APPLICATION_STATUS_LABELS = {
  ...STATUS_LABELS,
  ACTIVE: '선정 · 참여 중',
  SELECTED: '선정 · 참여 시작 전(이전 방식)',
  REJECTED: '미선정',
}
export const CONTENT_STATUS_LABELS = {
  ...STATUS_LABELS,
  SUBMITTED: '검토 대기',
  APPROVED: '최종 승인',
}

// 운영 기록(감사 로그)의 작업 코드 → 화면 이름입니다. 모르는 코드는 그대로 보여줍니다.
export const AUDIT_ACTION_LABELS = {
  CAMPAIGN_UPDATED: '캠페인 수정',
  CAMPAIGN_CLOSED: '캠페인 마감',
  CAMPAIGN_DELETED: '캠페인 삭제',
  CAMPAIGN_CONTACT_UPDATED: '캠페인 담당자 연락처 수정',
  CAMPAIGN_VISIT_CHANGED: '방문 장소 변경',
  CAMPAIGN_APPLICATION_SUBMITTED: '캠페인 신청',
  CAMPAIGN_APPLICATION_SELECTED: '참여자 선정',
  CAMPAIGN_APPLICATION_REJECTED: '미선정 처리',
  CAMPAIGN_APPLICATION_ACTIVATED: '참여 시작(이전 방식)',
  CAMPAIGN_APPLICATION_CANCELLED: '신청 취소',
  CAMPAIGN_EXPERIENCE_CONFIRMED: '체험 완료 확인',
  CAMPAIGN_CONTENT_SUBMITTED: '콘텐츠 제출',
  CAMPAIGN_CONTENT_REVISION_REQUESTED: '업체 수정 요청',
  CAMPAIGN_CONTENT_BRAND_APPROVED: '업체 검토 완료',
  CAMPAIGN_CONTENT_OPERATOR_REVISION_REQUESTED: '운영자 수정 요청',
  CAMPAIGN_CONTENT_OPERATOR_APPROVED: '운영자 최종 승인',
  INQUIRY_CREATED: '문의 등록',
  INQUIRY_ANSWERED: '문의 답변',
  INQUIRY_CLOSED: '문의 종료',
  COMMUNITY_HIDE: '커뮤니티 가리기',
  COMMUNITY_UNHIDE: '커뮤니티 다시 보이기',
  ADMIN_REPORT_EXPORTED: '운영 리포트 엑셀 내려받기',
  CAMPAIGN_SHIPPING_EXPORTED: '배송지 엑셀 내려받기',
}
export const AUDIT_TARGET_LABELS = {
  CAMPAIGN: '캠페인',
  CAMPAIGN_APPLICATION: '신청',
  CAMPAIGN_CONTENT: '콘텐츠',
  CAMPAIGN_EXPERIENCE: '체험',
  INQUIRY: '문의',
  ORDER: '주문',
  PAYMENT: '결제',
  PREORDER: '프리오더',
  SETTLEMENT: '정산',
  COMMUNITY_POST: '커뮤니티 글',
  COMMUNITY_COMMENT: '커뮤니티 댓글',
  ADMIN_REPORT: '운영 리포트',
}

export const ROLE_LABELS = { USER: '일반', ADMIN: '운영자' }
export const CAMPAIGN_TYPE_LABELS = {
  PRODUCT: '제품',
  LOCAL: '지역',
  REPORTER: '기자단',
  PURCHASE_REVIEW: '구매평',
}
export const NOTICE_CATEGORY_LABELS = {
  NOTICE: '공지',
  GUIDE: '가이드',
  EVENT: '이벤트',
}

/** 상태 코드를 화면 이름으로 바꿉니다. 모르는 코드는 그대로, 비어 있으면 '-'입니다. */
export function statusLabel(code) {
  if (!code) return '-'
  return STATUS_LABELS[code] || code
}

/** 상태 배지 색입니다: 정상·완료는 success, 정지·실패는 danger, 대기·요청은 warning입니다. */
export function statusTone(code) {
  if (
    [
      'ACTIVE',
      'APPROVED',
      'COMPLETED',
      'PAID',
      'DELIVERED',
      'SUCCESS',
      'CONFIRMED',
      'VERIFIED',
      'ACCEPTED',
    ].includes(code)
  )
    return 'success'
  if (
    [
      'SUSPENDED',
      'WITHDRAWN',
      'REJECTED',
      'FAILED',
      'CANCELLED',
      'REFUNDED',
      'DECLINED',
    ].includes(code)
  )
    return 'danger'
  if (
    [
      'PENDING',
      'PENDING_PAYMENT',
      'SUBMITTED',
      'REVISION_REQUESTED',
      'SCHEDULED',
      'PROPOSED',
      'READY',
      'UNVERIFIED',
    ].includes(code)
  )
    return 'warning'
  return 'neutral'
}

/** 금액을 '29,000원' 형식으로 표시합니다. 원화가 아니면 통화 코드를 붙입니다. */
export function money(value, currency = 'KRW') {
  if (value == null || value === '') return '-'
  const number = Number(value)
  if (!Number.isFinite(number)) return '-'
  const text = number.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
  return currency && currency !== 'KRW' ? `${text} ${currency}` : `${text}원`
}

/** 서버 시각(서울 기준, 시간대 없음)을 '2026.10.31 14:05'로 표시합니다. */
export function dateTime(value) {
  if (!value || typeof value !== 'string') return '-'
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/)
  if (!match) return '-'
  const [, y, m, d, hh, mm] = match
  return hh ? `${y}.${m}.${d} ${hh}:${mm}` : `${y}.${m}.${d}`
}

/** 날짜만 '2026.10.31'로 표시합니다. */
export function dateOnly(value) {
  return dateTime(value).split(' ')[0]
}

/**
 * 검색어와 칩 필터를 적용합니다.
 *
 * @param rows 목록
 * @param search 검색어(대소문자 무시)
 * @param searchKeys 검색할 필드 이름 목록
 * @param chip 고른 칩 값(빈 값이면 전체)
 * @param chipKey 칩으로 거를 필드 이름 또는 (row) => 값 함수
 */
export function filterRows(
  rows,
  { search = '', searchKeys = [], chip = '', chipKey },
) {
  const query = search.trim().toLowerCase()
  return rows.filter((row) => {
    if (chip) {
      const value = typeof chipKey === 'function' ? chipKey(row) : row[chipKey]
      if (value !== chip) return false
    }
    if (!query) return true
    return searchKeys.some((key) =>
      String(row[key] ?? '')
        .toLowerCase()
        .includes(query),
    )
  })
}

/** 상태별 건수 묶음({ACTIVE: 3, ...})을 화면 이름이 붙은 목록으로 바꿉니다. 많은 순입니다. */
export function countEntries(counts = {}, labels = STATUS_LABELS) {
  return Object.entries(counts)
    .map(([code, count]) => ({ code, label: labels[code] || code, count }))
    .sort((a, b) => b.count - a.count)
}
