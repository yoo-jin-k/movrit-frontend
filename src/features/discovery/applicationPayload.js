/**
 * 실제 신청 입력을 서버 DTO로 변환하며 현재 폼과 동의 버전을 포함합니다.
 * 방문형에는 배송 수령 정보를 보내지 않고 서버가 제공한 질문과 문서만 제출합니다.
 */
// 서버가 내려준 질문·동의 버전만 제출하며 방문형에는 배송정보를 포함하지 않습니다.
// 선택한 참여 방식과 서버 질문/동의 목록을 기준으로 값을 추립니다.
// 문서 ID·버전과 폼/조건 버전을 함께 보내므로 오래된 화면의 신청은 서버에서 구분할 수 있습니다.
export function applicationPayload(
  form,
  { type, message, contact, answers, consents },
  requirement = null,
) {
  return {
    message: message.trim(),
    expectedFormVersion: form.version,
    expectedEligibilityRequirementId: requirement?.id ?? null,
    expectedEligibilityRequirementVersion: requirement?.version ?? null,
    fulfillmentType: type,
    shippingContact: type === 'DELIVERY' ? contact : null,
    answers: form.questions
      .filter((q) => answers[q.id]?.trim())
      .map((q) => ({ questionId: q.id, value: answers[q.id] })),
    agreementAcceptances: form.agreements.map((d) => ({
      agreementId: d.id,
      version: d.version,
      accepted: consents[d.id] === true,
    })),
  }
}
