/**
 * 업체 참여자 관리의 '완료 후 별점·메모' 노출 규칙입니다.
 * 서버(PUT /api/campaigns/applications/{id}/rating)는 완료(COMPLETED) 참여에만 별점(1~5점)·메모 저장을 받습니다.
 * 화면은 완료 전에도 언제 남길 수 있는지 안내해, 입력 칸이 없는 이유를 알 수 있게 합니다.
 *
 * 변경 이력: 고치기 전에는 완료가 아닌 참여 상세에 별점·메모 영역이 아무 안내 없이 빠져 있어 기능이 없는 것처럼 보였습니다.
 * 고친 후에는 상태별 안내를 보여 주고, 목록에서도 완료 참여의 버튼을 '상세 · 별점'으로 표시합니다.
 */

// 선정 후 아직 진행 중인 상태입니다. 완료되면 별점·메모를 남길 수 있습니다.
const IN_PROGRESS = [
  'SELECTED',
  'ACTIVE',
  'CONTENT_SUBMITTED',
  'REVISION_REQUESTED',
  'BRAND_APPROVED',
  'APPROVED',
]

// 상태별로 별점·메모를 입력할 수 있는지와 안내 문구를 돌려줍니다.
export function ratingAvailability(status) {
  if (status === 'COMPLETED')
    return {
      editable: true,
      hint: '참여가 완료되어 별점(1~5점)과 브랜드 메모를 남길 수 있습니다. 다시 저장하면 고쳐집니다.',
    }
  if (IN_PROGRESS.includes(status))
    return {
      editable: false,
      hint: '별점(1~5점)과 메모는 참여가 완료된 뒤 이 자리에서 남길 수 있습니다.',
    }
  return {
    editable: false,
    hint: '별점과 메모는 완료된 참여에만 남길 수 있습니다.',
  }
}

// 목록의 상세 버튼 이름입니다. 완료 참여는 별점을 남길 수 있다는 것을 버튼에서 알립니다.
export const participantDetailLabel = (status) =>
  status === 'COMPLETED' ? '상세 · 별점' : '상세 보기'

// 고른 별점을 글로 알려 줍니다(별 모양만으로 상태를 전하지 않도록).
export const ratingChoiceLabel = (rating) =>
  rating >= 1 && rating <= 5 ? `${rating}점 선택` : '별점을 골라 주세요'
