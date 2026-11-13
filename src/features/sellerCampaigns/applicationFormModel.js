/**
 * 신청 폼의 초기값과 저장 요청을 구성하고 질문·문서의 ID·내용·버전을 검증합니다.
 * 문서나 필수 동의를 자동으로 만들지 않으며 입력된 계약 정보를 그대로 전달합니다.
 *
 * 참여 방식은 배송형·방문형 중 하나만 고릅니다(구매평은 직접 구매 하나). 방문형일 때만 방문 장소·방문 안내를 받습니다.
 * 변경 이력: 고치기 전에는 배송형·방문형을 함께 고를 수 있었습니다. 고친 후에는 하나만 고르고, 저장 전에도 하나인지 확인합니다.
 */
export const emptyApplicationForm = () => ({
  allowedFulfillmentTypes: [],
  questions: [],
  agreements: [],
})
// 참여 방식과 질문·문서를 검증하고 제출 가능한 DTO로 변환합니다.
// 식별자 중복이나 필수 문서 내용 누락은 서버 호출 전 오류로 반환합니다.
export function applicationFormRequest(value) {
  if (
    !Array.isArray(value.allowedFulfillmentTypes) ||
    value.allowedFulfillmentTypes.length === 0 ||
    value.allowedFulfillmentTypes.some(
      (type) => !['DELIVERY', 'VISIT', 'PURCHASE'].includes(type),
    )
  )
    throw new Error(
      '참여 방식(배송형·방문형, 구매평은 직접 구매)을 선택해 주세요.',
    )
  if (new Set(value.allowedFulfillmentTypes).size !== 1)
    throw new Error('참여 방식은 배송형·방문형 중 하나만 골라 주세요.')
  const seenQuestions = new Set(),
    seenAgreements = new Set()
  for (const question of value.questions) {
    if (
      !question.id?.trim() ||
      !question.label?.trim() ||
      seenQuestions.has(question.id)
    )
      throw new Error('질문 내용과 고유 식별자를 확인해 주세요.')
    seenQuestions.add(question.id)
    if (!['TEXT', 'TEXTAREA', 'SINGLE_CHOICE'].includes(question.type))
      throw new Error('지원하는 질문 유형을 선택해 주세요.')
    if (
      question.type === 'SINGLE_CHOICE' &&
      (!question.options.length ||
        question.options.some((v) => !v.trim()) ||
        new Set(question.options).size !== question.options.length)
    )
      throw new Error('서로 다른 선택지를 한 줄에 하나씩 입력해 주세요.')
    if (
      question.maxLength !== '' &&
      question.maxLength != null &&
      (!/^\d+$/.test(String(question.maxLength)) ||
        !Number.isSafeInteger(Number(question.maxLength)) ||
        Number(question.maxLength) < 1)
    )
      throw new Error('최대 글자 수는 1 이상의 정수로 입력해 주세요.')
  }
  for (const agreement of value.agreements) {
    if (
      !agreement.id?.trim() ||
      !agreement.title?.trim() ||
      !agreement.version?.trim() ||
      !agreement.body?.trim() ||
      agreement.body.length > 20000 ||
      seenAgreements.has(agreement.id)
    )
      throw new Error('동의문의 식별자·제목·버전·본문을 모두 확인해 주세요.')
    seenAgreements.add(agreement.id)
  }
  return {
    allowedFulfillmentTypes: [...value.allowedFulfillmentTypes],
    questions: value.questions.map((q) => ({
      ...q,
      maxLength:
        q.maxLength === '' || q.maxLength == null ? null : Number(q.maxLength),
      options: q.type === 'SINGLE_CHOICE' ? q.options : [],
    })),
    agreements: value.agreements.map((a) => ({ ...a })),
  }
}

// 참여 방식 하나를 고릅니다. 이전에 고른 값은 바꿉니다(배송형·방문형 택1).
export function chooseFulfillment(value, type) {
  return { ...value, allowedFulfillmentTypes: [type] }
}

// 방문형 참여인지 여부입니다. 방문 장소·방문 안내 입력은 이 값이 참일 때만 보입니다.
export const usesVisit = (types = []) =>
  Array.isArray(types) && types.includes('VISIT')

// 예전에 배송형·방문형을 함께 고른 신청서인지 확인합니다. 화면에서 하나를 다시 고르도록 안내합니다.
export const hasMixedFulfillment = (types = []) =>
  Array.isArray(types) && types.includes('DELIVERY') && types.includes('VISIT')

// 캠페인 종류를 바꿀 때 어울리는 참여 방식입니다.
// 지역(방문형 체험)은 방문형, 제품(배송형 체험)은 배송형, 구매평은 직접 구매로 맞춥니다.
// 기자단은 이미 고른 배송형·방문형 하나를 그대로 두고, 없거나 둘 다면 비워 다시 고르게 합니다.
export function fulfillmentForCampaignType(campaignType, current = []) {
  if (campaignType === 'PURCHASE_REVIEW') return ['PURCHASE']
  if (campaignType === 'LOCAL') return ['VISIT']
  if (campaignType === 'PRODUCT') return ['DELIVERY']
  const kept = current.filter((type) => type === 'DELIVERY' || type === 'VISIT')
  return kept.length === 1 ? kept : []
}

// 수정 중 방문형을 해제하면 저장할 때 기존 방문 장소·방문 안내가 지워진다는 안내입니다(없으면 빈 문자열).
// 숨긴 입력값은 저장 요청에 넣지 않으므로, 지워지기 전에 알립니다.
export function visitRemovalWarning({
  editing = false,
  savedTypes = [],
  currentTypes = [],
  savedVisitGuide = '',
} = {}) {
  if (!editing || usesVisit(currentTypes)) return ''
  const hadVisit =
    usesVisit(savedTypes) || Boolean(String(savedVisitGuide || '').trim())
  return hadVisit
    ? '방문형이 아니면 방문 장소·방문 안내를 받지 않습니다. 이대로 저장하면 기존 방문 장소와 방문 안내가 지워집니다.'
    : ''
}
