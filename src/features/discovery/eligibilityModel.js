const REASONS = {
  CAMPAIGN_NOT_OPEN: '현재 신청 기간이 아니거나 모집이 종료되었습니다.',
  CREATOR_NOT_APPROVED: '서버의 사용자 참여 정책 확인이 필요합니다.',
  FOLLOWER_REQUIREMENT_NOT_MET:
    '캠페인의 최소 팔로워 조건을 충족하지 못했습니다.',
  CHANNEL_METRIC_REQUIRED:
    '이 캠페인에 필요한 채널 지표가 등록되지 않았습니다.',
  CHANNEL_METRIC_UNVERIFIED: '등록된 채널 지표가 아직 확인되지 않았습니다.',
  CHANNEL_METRIC_BELOW_MINIMUM:
    '확인된 채널 지표가 이 캠페인의 최소 기준에 미달합니다.',
  CHANNEL_REQUIRED: '활동 채널 정보를 먼저 등록해 주세요.',
  EMAIL_VERIFICATION_REQUIRED: '이메일 인증을 완료해 주세요.',
  ALREADY_APPLIED: '이미 신청한 캠페인입니다.',
}

// 서버 판정과 폼 버전을 함께 확인하며 누락되거나 모순된 응답은 신청을 열지 않습니다.
export function validateEligibility(data, campaignId) {
  if (
    !data ||
    String(data.campaignId) !== String(campaignId) ||
    !Number.isInteger(data.formVersion) ||
    !Array.isArray(data.blockingReasons) ||
    data.blockingReasons.some((reason) => typeof reason !== 'string') ||
    ['canApply', 'emailVerified', 'identityVerified', 'alreadyApplied'].some(
      (key) => typeof data[key] !== 'boolean',
    )
  ) {
    throw new Error('신청 가능 상태를 확인할 수 없습니다.')
  }
  return data
}
export function applicationAvailable(eligibility, form) {
  return Boolean(
    form &&
    eligibility?.canApply === true &&
    eligibility.emailVerified === true &&
    eligibility.alreadyApplied === false &&
    eligibility.blockingReasons.length === 0 &&
    eligibility.formVersion === form.version &&
    String(eligibility.campaignId) === String(form.campaignId),
  )
}
export function eligibilityReason(code) {
  return (
    REASONS[code] ||
    '현재 신청할 수 없는 조건이 있습니다. 참여 정보를 확인해 주세요.'
  )
}

// 명시적인 null만 조건 없음입니다. 이전 서버의 누락 필드와 구분합니다.
export function campaignRequirementSummary(requirement) {
  if (requirement === null) return '추가 채널 지표 조건이 없습니다.'
  if (
    !requirement ||
    !Number.isSafeInteger(requirement.minimumValue) ||
    requirement.minimumValue < 0
  )
    return '캠페인별 채널 조건을 확인할 수 없습니다.'
  const channels = { INSTAGRAM: '인스타그램', NAVER_BLOG: '네이버 블로그' }
  const metrics = { FOLLOWER_COUNT: '팔로워 수', VISITOR_COUNT: '방문자 수' }
  if (!channels[requirement.channelType] || !metrics[requirement.metricType])
    return '캠페인에 별도 채널 지표 조건이 있습니다.'
  return `${channels[requirement.channelType]} ${metrics[requirement.metricType]} ${requirement.minimumValue.toLocaleString('ko-KR')} 이상${requirement.measurementPeriod ? ` (집계기간: ${requirement.measurementPeriod})` : ''}`
}
export function metricEvaluationSummary(evaluation) {
  if (!evaluation) return ''
  if (evaluation.actualValue == null)
    return '내 채널 지표: 미등록 · 등급 미산정'
  const value = Number.isSafeInteger(evaluation.actualValue)
    ? evaluation.actualValue.toLocaleString('ko-KR')
    : '확인 필요'
  const status =
    evaluation.verificationStatus === 'VERIFIED'
      ? '확인됨'
      : evaluation.verificationStatus === 'REJECTED'
        ? '확인 반려'
        : '미확인'
  return `내 채널 지표: ${value} · ${status} · 등급 미산정`
}
