/**
 * 운영자 콘텐츠 최종 승인 화면의 규칙을 모아 둡니다(화면 없이 테스트할 수 있도록 분리).
 *
 * - 운영자는 '검토 대기(SUBMITTED)'와 '업체 검토 완료(BRAND_APPROVED)' 콘텐츠를 최종 승인하거나 수정 요청할 수 있습니다.
 * - 기본 목록은 업체 검토가 끝나 최종 승인을 기다리는 콘텐츠입니다.
 * - 수정 요청에는 참여자에게 전달할 의견이 꼭 필요합니다.
 */

// 목록 상태 필터 순서입니다. 첫 항목이 기본값입니다.
export const REVIEW_FILTERS = [
  ['BRAND_APPROVED', '최종 승인 대기'],
  ['SUBMITTED', '업체 검토 전'],
  ['REVISION_REQUESTED', '수정 요청됨'],
  ['APPROVED', '최종 승인 완료'],
  ['', '전체'],
]

// 운영자가 처리할 수 있는 상태인지 확인합니다.
export function canOperatorReview(submission) {
  return ['SUBMITTED', 'BRAND_APPROVED'].includes(submission?.status)
}

// 검색어(참여자·캠페인·번호)와 상태로 목록을 거릅니다.
export function filterSubmissions(items, status, search) {
  const query = search.trim().toLowerCase()
  return items.filter(
    (item) =>
      (!status || item.status === status) &&
      `${item.creatorNickname || ''} ${item.campaignTitle || ''} ${item.id} ${item.applicationId}`
        .toLowerCase()
        .includes(query),
  )
}

// 처리 요청 본문을 만듭니다. 버전이 없거나, 수정 요청인데 의견이 비어 있으면 저장 전에 막습니다.
export function reviewPayload(action, submission, comment) {
  if (!Number.isSafeInteger(submission?.version))
    throw new Error('최신 목록을 다시 불러와 주세요.')
  const text = comment.trim()
  if (action === 'request-revision' && !text)
    throw new Error('수정 요청 의견을 입력해 주세요.')
  if (!['approve', 'request-revision'].includes(action))
    throw new Error('처리 방법을 선택해 주세요.')
  return { comment: text || null, expectedVersion: submission.version }
}
