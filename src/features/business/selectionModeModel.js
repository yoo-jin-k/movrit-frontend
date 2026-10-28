/** 선정 주체가 확인되지 않으면 명령을 열지 않습니다. 브랜드 선정과 운영자 선정은 별도입니다. */
export const SELECTION_MODES = {
  BRAND_DIRECT: '브랜드 직접 선정',
  OPERATOR: '운영자 선정',
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
