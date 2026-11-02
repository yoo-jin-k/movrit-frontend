/**
 * 운영자 '캠페인 관리' 화면의 필터·표시 문구입니다(화면 없이 테스트할 수 있도록 분리).
 */

export const CAMPAIGN_STATES = {
  UPCOMING: '모집 예정',
  RECRUITING: '모집 중',
  ENDED: '모집 마감',
  HIDDEN: '숨김(마감 처리)',
}

export const CAMPAIGN_STATE_FILTERS = [
  ['', '전체 상태'],
  ['RECRUITING', '모집 중'],
  ['UPCOMING', '모집 예정'],
  ['ENDED', '모집 마감'],
  ['HIDDEN', '숨김'],
]

export const CAMPAIGN_TYPE_LABELS = {
  PRODUCT: '제품',
  LOCAL: '지역',
  REPORTER: '기자단',
  PURCHASE_REVIEW: '구매평',
}

// 점검용 캠페인([QA], [QA-E2E] 등)은 제목 앞의 대괄호 표시로 구분합니다.
export function isQaCampaign(item) {
  return /^\[QA/i.test(String(item?.title || ''))
}

// 상태·검색어(제목·브랜드·번호)·점검용 포함 여부로 목록을 좁힙니다.
export function filterAdminCampaigns(
  items,
  { state = '', search = '', showQa = true } = {},
) {
  const keyword = String(search).trim().toLowerCase()
  return (Array.isArray(items) ? items : []).filter(
    (item) =>
      (!state || item.state === state) &&
      (showQa || !isQaCampaign(item)) &&
      (!keyword ||
        String(item.id) === keyword ||
        [item.title, item.brandName]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword))),
  )
}

// 숨김 사유는 업체 알림에 그대로 전달되므로 비어 있으면 막습니다.
export function closeReasonError(reason) {
  const value = String(reason || '').trim()
  if (!value) return '숨김 사유를 입력해 주세요. 업체에 그대로 전달됩니다.'
  if (value.length > 300) return '숨김 사유는 300자 이내로 입력해 주세요.'
  return ''
}
