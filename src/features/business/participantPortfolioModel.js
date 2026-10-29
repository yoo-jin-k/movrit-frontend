/** 서버가 확인한 완료 횟수와 지표만 표시하며 누락된 수치를 0으로 바꾸지 않습니다. */
export function completedCountLabel(value) {
  return Number.isSafeInteger(value) && value >= 0
    ? value === 0
      ? '신규 참여자 · 완료 0회'
      : `완료 ${value.toLocaleString('ko-KR')}회`
    : '완료 횟수 확인 필요'
}
export function metricValueLabel(value) {
  return Number.isSafeInteger(value) && value >= 0
    ? value.toLocaleString('ko-KR')
    : '미제공'
}
export function channelLabel(value) {
  return (
    {
      INSTAGRAM: '인스타그램',
      NAVER_BLOG: '네이버 블로그',
      BLOG: '블로그',
      YOUTUBE: '유튜브',
      CLIP: '클립',
      OTHER: '기타',
      LEGACY: '기존 콘텐츠',
    }[value] ||
    value ||
    '채널 미제공'
  )
}
export function validateParticipantDetail(data, applicationId) {
  if (
    !data ||
    String(data.applicationId) !== String(applicationId) ||
    !data.profile ||
    !Number.isSafeInteger(data.completedCampaignCount) ||
    data.completedCampaignCount < 0 ||
    !Array.isArray(data.metrics) ||
    !Array.isArray(data.applicationAnswers) ||
    !Array.isArray(data.completedCampaigns) ||
    !data.requirementEvaluation ||
    typeof data.requirementEvaluation.satisfied !== 'boolean'
  )
    throw new Error('참여자 상세 응답을 확인할 수 없습니다.')
  return data
}
export function requirementResult(evaluation) {
  if (evaluation?.evaluationBasis === 'NO_REQUIREMENT_AT_APPLICATION')
    return '추가 채널 조건 없음'
  if (evaluation?.evaluationBasis === 'APPLICATION_SNAPSHOT_UNAVAILABLE')
    return '신청 당시 조건 확인 불가'
  if (
    !evaluation ||
    evaluation.evaluationBasis !== 'CURRENT_METRIC_AGAINST_APPLICATION_SNAPSHOT'
  )
    return '조건 확인 필요'
  if (!evaluation.applicationRequirementSnapshot)
    return '신청 당시 조건 확인 불가'
  if (evaluation.satisfied === true) return '현재 조건 충족'
  return (
    {
      MEASUREMENT_PERIOD_MISMATCH: '지표 집계 기간 불일치',
      CHANNEL_METRIC_REQUIRED: '채널 지표 미등록',
      CHANNEL_METRIC_UNVERIFIED: '채널 지표 확인 필요',
      CHANNEL_METRIC_BELOW_MINIMUM: '현재 지표 기준 미달',
    }[evaluation.reason] || '현재 조건 미충족'
  )
}
