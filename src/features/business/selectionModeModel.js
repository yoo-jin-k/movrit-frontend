/**
 * 선정 주체가 확인되지 않으면 명령을 열지 않습니다. 브랜드 선정과 운영자 선정은 별도입니다.
 * 선착순(FIRST_COME)은 방문형 캠페인 전용이며, 신청하면 모집 인원이 찰 때까지 바로 선정되어 선정 명령이 없습니다.
 */
export const SELECTION_MODES = {
  BRAND_DIRECT: '브랜드 직접 선정',
  OPERATOR: '운영자 선정',
  FIRST_COME: '선착순 (방문형)',
}

// 선착순은 방문형(LOCAL·방문 참여)만 됩니다. 선착순을 고르면 방문형으로 맞추고,
// 방문형이 아닌 종류로 바꾸면 선착순을 브랜드 직접 선정으로 되돌립니다.
// 돌려주는 fulfillment가 null이 아니면 신청서 참여 방식을 그 값으로 바꿔야 합니다.
export function applySelectionModeRules(previous, next) {
  if (
    next.selectionMode === 'FIRST_COME' &&
    previous.selectionMode !== 'FIRST_COME'
  )
    return {
      form: { ...next, campaignType: 'LOCAL' },
      fulfillment: ['VISIT'],
    }
  if (
    next.selectionMode === 'FIRST_COME' &&
    (next.campaignType || 'PRODUCT') !== 'LOCAL'
  )
    return {
      form: { ...next, selectionMode: 'BRAND_DIRECT' },
      fulfillment: null,
    }
  return { form: next, fulfillment: null }
}

// 저장 전에 선착순 캠페인의 참여 방식이 방문 하나인지 확인합니다.
export function firstComeError(form, fulfillmentTypes = []) {
  if (form.selectionMode !== 'FIRST_COME') return ''
  return fulfillmentTypes.length === 1 && fulfillmentTypes[0] === 'VISIT'
    ? ''
    : '선착순 캠페인은 방문 참여만 받을 수 있습니다. 신청서의 참여 방식을 방문으로 맞춰 주세요.'
}
export function canSelectApplication(application, mode, actor) {
  return (
    application?.status === 'SUBMITTED' &&
    ((actor === 'brand' && mode === 'BRAND_DIRECT') ||
      (actor === 'admin' && mode === 'OPERATOR'))
  )
}
export function selectionModeField(form, original) {
  const value =
    form.selectionMode ??
    original?.selectionMode ??
    (original ? undefined : 'BRAND_DIRECT')
  if (value === undefined) return {}
  if (!Object.hasOwn(SELECTION_MODES, value))
    throw new Error('선정 방식을 확인해 주세요.')
  return { selectionMode: value }
}
