/**
 * 참여자 본인의 신청 취소 규칙입니다. 주문 취소와 분리됩니다.
 * - 선정 전(접수 SUBMITTED)에만 본인이 신청을 취소할 수 있습니다.
 * - 선정된 뒤(선정·참여 중)에는 본인이 취소할 수 없고, 사정이 생기면 업체에 문의해 업체가 '참여 취소'로 처리합니다.
 */
export function canCancelCampaign(application) {
  return application?.status === 'SUBMITTED'
}

// 선정 후 참여 중인 신청은 취소 버튼 대신 업체 문의 안내를 보여줍니다.
export function needsBrandForCancellation(application) {
  return ['SELECTED', 'ACTIVE'].includes(application?.status)
}

export function cancellationPayload(application, reason) {
  if (!canCancelCampaign(application))
    throw new Error('선정 전 접수 상태에서만 신청을 취소할 수 있습니다.')
  const value = String(reason || '').trim()
  if (!value) throw new Error('취소 사유를 입력해 주세요.')
  return { reason: value }
}
