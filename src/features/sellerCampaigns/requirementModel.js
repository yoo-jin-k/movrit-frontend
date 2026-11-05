/**
 * 참여 조건의 화면 초기값·요청·응답 검증을 모읍니다.
 * 쓰기는 지원하는 두 조건(인스타그램 팔로워 수, 네이버 블로그 일평균 방문자)으로 제한하고 조회 응답의 캠페인 ID와 버전을 확인합니다.
 * 업체 캠페인 편집 화면과 운영자 캠페인 관리 화면이 함께 씁니다.
 */

// 화면에서 고를 수 있는 조건 종류입니다. 채널·지표·집계 기간은 서버 정책과 같은 값으로 고정합니다.
export const REQUIREMENT_KINDS = {
  INSTAGRAM_FOLLOWERS: {
    label: '인스타그램 팔로워 수',
    channelType: 'INSTAGRAM',
    metricType: 'FOLLOWER_COUNT',
    measurementPeriod: null,
    unit: '명',
    help: '참여자가 설정에서 연결·확인한 인스타그램 팔로워 수로 판정합니다.',
  },
  NAVER_BLOG_DAILY_VISITORS: {
    label: '네이버 블로그 일평균 방문자',
    channelType: 'NAVER_BLOG',
    metricType: 'DAILY_VISITORS',
    measurementPeriod: 'RECENT_4_DAYS',
    unit: '명',
    help: '참여자가 신청할 때 블로그 방문자 위젯으로 확인한 최근 4일 평균(오늘 제외)으로 판정합니다. 방문자 수는 이 조건이 있는 캠페인에서만 공개됩니다.',
  },
}

// 저장된 채널·지표 조합에 맞는 조건 종류를 찾습니다. 지원하지 않는 조합이면 null입니다.
export function requirementKind(value) {
  const found = Object.entries(REQUIREMENT_KINDS).find(
    ([, kind]) =>
      kind.channelType === value?.channelType &&
      kind.metricType === value?.metricType &&
      (kind.measurementPeriod ?? null) === (value?.measurementPeriod || null),
  )
  return found ? found[0] : null
}

export const emptyRequirement = () => ({
  mode: 'NONE',
  channelType: 'INSTAGRAM',
  metricType: 'FOLLOWER_COUNT',
  measurementPeriod: null,
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
// 조건 없음은 null로 보내며 지원하는 조건 종류만 요청으로 변환합니다.
export function requirementPayload(form) {
  if (form.mode === 'NONE') return null
  const kind = REQUIREMENT_KINDS[requirementKind(form)]
  if (!kind)
    throw new Error(
      '인스타그램 팔로워 수 또는 네이버 블로그 일평균 방문자 조건만 설정할 수 있습니다.',
    )
  if (
    !/^\d+$/.test(String(form.minimumValue)) ||
    !Number.isSafeInteger(Number(form.minimumValue))
  )
    throw new Error('최소 수치를 0 이상의 정수로 입력해 주세요.')
  return {
    channelType: kind.channelType,
    metricType: kind.metricType,
    minimumValue: Number(form.minimumValue),
    measurementPeriod: kind.measurementPeriod,
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
