/** 서버가 허용한 접수·선정·진행 단계의 참여 취소만 요청합니다. 주문 취소와 분리됩니다. */
export function canCancelCampaign(application) {
  return ['SUBMITTED', 'SELECTED', 'ACTIVE'].includes(application?.status)
}
export function cancellationPayload(application, reason) {
  if (!canCancelCampaign(application))
    throw new Error('현재 상태에서는 참여를 취소할 수 없습니다.')
  const value = String(reason || '').trim()
  if (!value) throw new Error('취소 사유를 입력해 주세요.')
  return { reason: value }
}
