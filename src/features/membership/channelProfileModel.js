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
