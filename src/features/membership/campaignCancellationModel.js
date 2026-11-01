/**
 * 참여자 본인의 캠페인 취소 규칙입니다.
 * - 캠페인 신청은 한 번 하면 본인이 취소할 수 없습니다(서버도 409로 거절합니다).
 * - 참여가 어려운 사정이 생기면 업체에 문의하고, 업체가 선정 편집의 '참여 취소'로 처리합니다.
 * 이 함수는 취소 버튼 대신 '업체에 문의해 주세요' 안내를 보여줄 상태인지 판단합니다.
 */
export function showsCancellationHelp(application) {
  return ['SUBMITTED', 'SELECTED', 'ACTIVE'].includes(application?.status)
}
