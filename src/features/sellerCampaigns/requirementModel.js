export const emptyRequirement = () => ({
  mode: 'NONE',
  channelType: 'INSTAGRAM',
  metricType: 'FOLLOWER_COUNT',
  minimumValue: '',
})
export function requirementForm(requirement) {
  return requirement === null
    ? emptyRequirement()
    : {
        mode: 'CONDITION',
        ...requirement,
        minimumValue: String(requirement.minimumValue),
      }
}
export function requirementPayload(form) {
  if (form.mode === 'NONE') return null
  if (
    form.channelType !== 'INSTAGRAM' ||
    form.metricType !== 'FOLLOWER_COUNT' ||
    form.measurementPeriod
  )
    throw new Error('현재 인스타그램 팔로워 수 조건만 설정할 수 있습니다.')
  if (
    !/^\d+$/.test(String(form.minimumValue)) ||
    !Number.isSafeInteger(Number(form.minimumValue))
  )
    throw new Error('최소 수치를 0 이상의 정수로 입력해 주세요.')
  return {
    channelType: 'INSTAGRAM',
    metricType: 'FOLLOWER_COUNT',
    minimumValue: Number(form.minimumValue),
    measurementPeriod: null,
  }
}
export function validateRequirement(data, campaignId) {
  if (data === null || data === '') return null
  if (
    !data ||
    !Number.isSafeInteger(data.id) ||
    !Number.isSafeInteger(data.version) ||
    data.version < 0 ||
    String(data.campaignId) !== String(campaignId) ||
    typeof data.channelType !== 'string' ||
    typeof data.metricType !== 'string' ||
    !Number.isSafeInteger(data.minimumValue) ||
    data.minimumValue < 0
  )
    throw new Error('참여 조건 응답을 확인할 수 없습니다.')
  return data
}
