/**
 * 운영자 '채널 확인' 화면의 목록 필터와 표시 문구입니다(화면 없이 테스트할 수 있도록 분리).
 */

export const CHANNEL_REVIEW_FILTERS = [
  ['PENDING', '확인 대기'],
  ['VERIFIED', '확인됨'],
  ['REJECTED', '반려'],
  ['', '전체'],
]

export const CHANNEL_REVIEW_STATUS = {
  PENDING: '확인 대기',
  VERIFIED: '확인됨',
  REJECTED: '반려',
}

// 상태와 검색어(닉네임·이메일·계정 이름)로 목록을 좁힙니다.
export function filterChannelReviews(items, status, search) {
  const keyword = String(search || '')
    .trim()
    .toLowerCase()
  return (Array.isArray(items) ? items : []).filter(
    (item) =>
      (!status || item.verificationStatus === status) &&
      (!keyword ||
        [item.memberNickname, item.memberEmail, item.accountName]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword))),
  )
}

// 반려 사유는 회원에게 그대로 전달되므로 비어 있으면 막습니다.
export function rejectReasonError(reason) {
  const value = String(reason || '').trim()
  if (!value) return '반려 사유를 입력해 주세요. 회원에게 그대로 전달됩니다.'
  if (value.length > 500) return '반려 사유는 500자 이내로 입력해 주세요.'
  return ''
}
