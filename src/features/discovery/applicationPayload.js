// 서버가 내려준 질문·동의 버전만 제출하며 방문형에는 배송정보를 포함하지 않습니다.
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
