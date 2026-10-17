import { CAMPAIGN_DETAIL_IMAGE_LIMIT } from './campaignMediaValidation.js'

// API DTO가 아닌 화면 전용 모델입니다. 업로드·저장 요청은 최종 계약 확정 후 어댑터에서 연결합니다.
export function emptyCampaignMediaDraft() {
  return {
    representative: null,
    details: [],
    location: null,
    locationConfirmed: false,
  }
}

export function appendDetailImage(draft, image) {
  if (draft.details.length >= CAMPAIGN_DETAIL_IMAGE_LIMIT)
    throw new Error('상세 이미지는 최대 5장까지 등록하실 수 있습니다.')
  if (!image?.key || draft.details.some((item) => item.key === image.key))
    throw new Error('이미지 항목을 확인해 주세요.')
  return {
    ...draft,
    details: [...draft.details, { ...image, altText: image.altText || '' }],
  }
}

// 배열 순서만 변경합니다. 파일·자산 식별자와 대체 설명은 그대로 유지합니다.
export function moveDetailImage(draft, key, direction) {
  if (![-1, 1].includes(direction)) return draft
  const index = draft.details.findIndex((item) => item.key === key),
    next = index + direction
  if (index < 0 || next < 0 || next >= draft.details.length) return draft
  const details = [...draft.details]
  ;[details[index], details[next]] = [details[next], details[index]]
  return { ...draft, details }
}

// 화면에서 참조를 제거하는 동작이며 서버 파일의 물리 삭제를 요청하지 않습니다.
export function removeDetailImage(draft, key) {
  return { ...draft, details: draft.details.filter((item) => item.key !== key) }
}

export function updateDetailAltText(draft, key, altText) {
  if (typeof altText !== 'string' || Array.from(altText).length > 200)
    throw new Error('이미지 설명은 200자 이내로 입력해 주세요.')
  return {
    ...draft,
    details: draft.details.map((item) =>
      item.key === key ? { ...item, altText } : item,
    ),
  }
}

// 방문 미허용 시 공개 미리보기에서만 숨깁니다. 비활성 장소값을 삭제하거나 재방문 공개를 자동 승인하지 않습니다.
export function previewVisitLocation(draft, fulfillmentTypes) {
  return fulfillmentTypes.includes('VISIT') && draft.locationConfirmed
    ? draft.location
    : null
}
