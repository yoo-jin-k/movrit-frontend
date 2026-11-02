/**
 * 캠페인 복제 규칙입니다(업체 '캠페인 복제' → 새 캠페인 작성 화면에 원본 내용을 채움).
 *
 * - 그대로 가져오는 것: 운영 브랜드, 선정 방식, 설명·분류·종류·지역·채널, 모집 인원, 제공 내역, 참여 안내(미션 등),
 *   참여 조건, 신청서(참여 방식·질문·동의 문서), 구매평 구매 안내, 이미지(새로 올림)·방문 주소(다시 확인 필요)
 * - 비우는 것: 모집 기간과 세부 일정(새로 입력해야 함), 함께 판매할 프리오더(프리오더당 캠페인 1개)
 * - 제목 앞에 '[복제]'를 붙여 원본과 구분합니다. 저장 전까지 서버에는 아무것도 만들어지지 않습니다.
 */
import {
  GUIDE_FIELDS,
  SCHEDULE_FIELDS,
  emptyCampaign,
} from './campaignEditorModel.js'

const COPIED_FIELDS = [
  'selectionMode',
  'description',
  'category',
  'campaignType',
  'region',
  'contentChannel',
  'recruitmentCount',
  'rewardDescription',
  ...GUIDE_FIELDS,
]

// 원본 상세로 새 캠페인 입력값을 만듭니다. brands는 내 브랜드 목록(이름으로 운영 브랜드를 찾습니다).
export function copiedCampaignForm(detail, brands = []) {
  const base = emptyCampaign()
  const copied = Object.fromEntries(
    COPIED_FIELDS.map((field) => [field, detail?.[field] ?? base[field]]),
  )
  const brand = brands.find((item) => item.name === detail?.brandName)
  return {
    ...base,
    ...copied,
    // 화면 입력 칸은 값이 없으면 빈 문자열을 씁니다.
    region: copied.region || '',
    contentChannel: copied.contentChannel || '',
    recruitmentCount:
      detail?.recruitmentCount == null ? '' : String(detail.recruitmentCount),
    brandId: brand ? brand.id : brands.length === 1 ? brands[0].id : '',
    preorderId: '',
    title: `[복제] ${detail?.title || ''}`.slice(0, 200),
    startAt: '',
    endAt: '',
    ...Object.fromEntries(SCHEDULE_FIELDS.map((field) => [field, ''])),
  }
}

// 원본 신청서에서 버전 정보를 빼고 참여 방식·질문·동의 문서만 가져옵니다.
export function copiedApplicationForm(form) {
  if (!form) return null
  return {
    allowedFulfillmentTypes: [...(form.allowedFulfillmentTypes || [])],
    questions: (form.questions || []).map((q) => ({
      ...q,
      options: [...(q.options || [])],
    })),
    agreements: (form.agreements || []).map((a) => ({ ...a })),
  }
}

// 원본 이미지 초안을 새로 올릴 파일로 바꿉니다(원본 자산 ID는 다른 캠페인에 쓸 수 없습니다).
// 방문 주소는 가져오되 다시 확인하도록 확인 표시를 지웁니다.
export function copiedMediaDraft(draft, makeKey = () => crypto.randomUUID()) {
  const fresh = (image) =>
    image?.file
      ? {
          key: makeKey(),
          file: image.file,
          altText: image.altText || '',
          status: 'pending',
        }
      : null
  return {
    representative: fresh(draft?.representative),
    details: (draft?.details || []).map(fresh).filter(Boolean),
    location: draft?.location ? { ...draft.location } : null,
    locationConfirmed: false,
  }
}

// 예전 방식(이미지 주소만 있는) 캠페인의 대표 이미지를 파일로 받아 옵니다. 실패하면 null입니다.
export async function imageFileFromUrl(url) {
  if (!url || !/^\/(assets|api|uploads)\//.test(url)) return null
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    if (!['image/jpeg', 'image/png'].includes(blob.type)) return null
    const name = url.split('/').pop()?.split('?')[0] || 'image'
    return new File([blob], name.includes('.') ? name : `${name}.png`, {
      type: blob.type,
    })
  } catch {
    return null
  }
}
