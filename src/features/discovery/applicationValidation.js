/**
 * 미리보기 입력의 필수값·질문 선택·동의 버전을 검사해 필드별 오류를 만듭니다.
 * 인증·동의 효력·실제 모집 마감과 접근 권한은 이 검증으로 확정하지 않습니다.
 */
// 서버의 ApplicationFormValidator 규칙 중 화면에서 확인 가능한 조건만 검증합니다.
// 인증 근거, 실제 동의 효력, 마감 및 권한의 최종 판정은 서버 책임으로 남겨 둡니다.
export function validateApplicationPreview(form, values, displayedVersion) {
  const errors = {}
  if (displayedVersion !== form.termsVersion)
    errors.version = '조건이 변경되었습니다. 최신 조건을 다시 확인해 주세요.'

  if (form.experienceType === 'DELIVERY') {
    for (const [key, label] of [
      ['recipientName', '수령인'],
      ['phone', '연락처'],
      ['postalCode', '우편번호'],
      ['addressLine1', '주소'],
    ]) {
      if (!values.deliveryAddress?.[key]?.trim())
        errors[key] =
          `${label}${key === 'recipientName' ? '을' : '를'} 입력해 주세요.`
    }
    if (
      values.deliveryAddress?.additionalDetailNeeded &&
      !values.deliveryAddress.addressLine2?.trim()
    ) {
      errors.addressLine2 = '상세주소를 입력해 주세요.'
    }
  } else if (values.deliveryAddress != null) {
    errors.deliveryAddress =
      '방문형 또는 이행 유형이 미구성인 신청에는 수령정보를 입력할 수 없습니다.'
  }

  for (const q of form.questions) {
    const answer = values.answers[q.id]
    if (q.type === 'SHORT_TEXT') {
      const text = answer?.text || ''
      if (q.required && !text.trim())
        errors[`question-${q.id}`] = '필수 질문에 답변해 주세요.'
      if (q.maxLength != null && Array.from(text).length > q.maxLength)
        errors[`question-${q.id}`] = `${q.maxLength}자 이내로 입력해 주세요.`
    } else {
      const selected = answer?.optionIds || []
      const allowed = new Set(q.options.map((option) => option.id))
      const minimum = Math.max(q.required ? 1 : 0, q.minSelections || 0)
      if (
        new Set(selected).size !== selected.length ||
        selected.some((id) => !allowed.has(id)) ||
        selected.length < minimum ||
        (q.maxSelections != null && selected.length > q.maxSelections)
      ) {
        errors[`question-${q.id}`] =
          `${minimum}개 이상 ${q.maxSelections}개 이하의 항목을 선택해 주세요.`
      }
    }
    if (answer && answer.questionVersion !== q.version)
      errors[`question-${q.id}`] =
        '질문 버전이 변경되었습니다. 다시 답변해 주세요.'
  }

  for (const document of form.consents) {
    const consent = values.consents[document.documentId]
    if (!consent || consent.documentVersionId !== document.documentVersionId) {
      errors[`consent-${document.documentId}`] =
        '표시된 문서 버전을 확인하고 동의 여부를 선택해 주세요.'
    } else if (document.required && !consent.accepted) {
      errors[`consent-${document.documentId}`] =
        '필수 확인 항목입니다. 동의하지 않으면 진행할 수 없습니다.'
    }
  }
  return errors
}
