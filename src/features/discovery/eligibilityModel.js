const REASONS = {
  CAMPAIGN_NOT_OPEN: '현재 신청 기간이 아니거나 모집이 종료되었습니다.',
  CREATOR_NOT_APPROVED: '크리에이터 승인 후 신청할 수 있습니다.',
  FOLLOWER_REQUIREMENT_NOT_MET:
    '캠페인의 최소 팔로워 조건을 충족하지 못했습니다.',
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
    [
      'canApply',
      'emailVerified',
      'identityVerified',
      'channelReady',
      'alreadyApplied',
    ].some((key) => typeof data[key] !== 'boolean')
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
    eligibility.channelReady === true &&
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
