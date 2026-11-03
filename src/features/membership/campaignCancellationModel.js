/**
 * 참여자 본인의 캠페인 취소 안내 규칙입니다.
 * - 선정 발표 전에는 '신청 철회', 선정 뒤에는 '참여 취소'(단순·협의)를 '참여 조정' 영역에서 합니다.
 * - 이 함수는 콘텐츠 제출 영역에 그 안내 문구를 보여줄 상태인지 판단합니다.
 */
export function showsCancellationHelp(application) {
  return ['SUBMITTED', 'SELECTED', 'ACTIVE'].includes(application?.status)
}
