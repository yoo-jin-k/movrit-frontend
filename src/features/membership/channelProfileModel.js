/**
 * 채널 프로필 응답과 직접 입력한 인스타그램 수치를 검사합니다.
 * 수치 형식과 검증 상태 라벨을 구분하며 입력만으로 검증 완료 상태를 만들지 않습니다.
 */
export function validateChannelProfile(data) {
  if (
    !data ||
    typeof data.profileExists !== 'boolean' ||
    !Array.isArray(data.metrics) ||
    data.metrics.some(
      (metric) =>
        !metric ||
        !Number.isSafeInteger(metric.id) ||
        typeof metric.channelType !== 'string' ||
        typeof metric.metricType !== 'string' ||
        !Number.isSafeInteger(metric.value) ||
        metric.value < 0 ||
        !['UNVERIFIED', 'VERIFIED', 'REJECTED'].includes(
          metric.verificationStatus,
        ),
    )
  ) {
    throw new Error('채널 지표 응답을 확인할 수 없습니다.')
  }
  return data
}
// 입력 문자열을 정수 수치로 변환하며 현재 지원하는 채널·지표 계약에 맞춰 요청을 만듭니다.
export function instagramMetricRequest(value) {
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)))
    throw new Error('팔로워 수를 0 이상의 정수로 입력해 주세요.')
  return {
    channelType: 'INSTAGRAM',
    metricType: 'FOLLOWER_COUNT',
    value: Number(value),
    measurementPeriod: null,
    measuredAt: null,
  }
}
export function metricVerificationLabel(status) {
  return (
    { VERIFIED: '확인됨', UNVERIFIED: '미확인', REJECTED: '확인 반려' }[
      status
    ] || '확인 필요'
  )
}
