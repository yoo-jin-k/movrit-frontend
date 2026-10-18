/**
 * 신청 폼의 초기값과 저장 요청을 구성하고 질문·문서의 ID·내용·버전을 검증합니다.
 * 문서나 필수 동의를 자동으로 만들지 않으며 입력된 계약 정보를 그대로 전달합니다.
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
      (type) => !['DELIVERY', 'VISIT'].includes(type),
    )
  )
    throw new Error('배송형 또는 방문형을 선택해 주세요.')
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
