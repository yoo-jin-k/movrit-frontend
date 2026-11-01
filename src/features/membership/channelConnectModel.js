/**
 * SNS 채널 연결 화면의 표시 규칙입니다(화면 없이 테스트할 수 있도록 분리).
 */

// 연결할 수 있는 서비스와 안내 문구입니다. 서버 응답의 provider 값과 같은 이름을 씁니다.
export const CHANNEL_PROVIDERS = {
  instagram: {
    label: '인스타그램',
    hint: '크리에이터·비즈니스 계정은 로그인 연결로 팔로워 수가 바로 확인됩니다. 개인 계정은 직접 등록해 주세요.',
    manualHint:
      '프로필 주소와 팔로워 수, 프로필 화면 캡처를 등록하면 운영자가 확인합니다.',
    example: 'https://www.instagram.com/아이디',
    countLabel: '팔로워 수',
    countRequired: true,
  },
  youtube: {
    label: '유튜브',
    hint: '유튜브 채널이 있는 Google 계정으로 연결하면 구독자 수가 바로 확인됩니다.',
    manualHint:
      '채널 주소와 구독자 수, 채널 화면 캡처를 등록하면 운영자가 확인합니다.',
    example: 'https://www.youtube.com/@핸들',
    countLabel: '구독자 수',
    countRequired: true,
  },
  'naver-blog': {
    label: '네이버 블로그',
    hint: '네이버 아이디로 로그인해 블로그를 확인합니다. 이웃 수는 네이버가 제공하지 않아 가져오지 않습니다.',
    manualHint:
      '블로그 주소와 블로그 화면 캡처를 등록하면 운영자가 확인합니다. 이웃 수는 선택입니다.',
    example: 'https://blog.naver.com/아이디',
    countLabel: '이웃 수(선택)',
    countRequired: false,
  },
}

// 콜백 주소의 서비스 이름이 우리가 아는 값인지 확인합니다.
export function isChannelProvider(value) {
  return Object.hasOwn(CHANNEL_PROVIDERS, value || '')
}

// 팔로워(구독자) 수 표시 문구입니다. 숫자가 없으면 이유를 짧게 안내합니다.
export function followerText(provider, count) {
  if (count == null)
    return provider === 'naver-blog' ? '이웃 수 미제공' : '수치 비공개'
  const unit = provider === 'youtube' ? '구독자' : '팔로워'
  return `${unit} ${Number(count).toLocaleString('ko-KR')}명`
}

// 서버 오류 응답에서 사용자에게 보여줄 문구를 고릅니다.
export function channelErrorMessage(error, fallback) {
  return error?.response?.data?.detail || fallback
}

// 연결 방법과 확인 상태를 한 줄 배지 문구로 바꿉니다.
export function connectionBadge(connection) {
  if (!connection) return null
  const method = connection.method === 'MANUAL' ? '직접 등록' : '로그인 연결'
  const status = {
    VERIFIED: ['확인됨', 'is-ok'],
    PENDING: ['확인 대기', 'is-pending'],
    REJECTED: ['반려', 'is-error'],
  }[connection.verificationStatus] || ['확인 필요', 'is-pending']
  return { text: `${method} · ${status[0]}`, tone: status[1] }
}

const IMAGE_TYPES = ['image/jpeg', 'image/png']
const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024

// 직접 등록 입력을 서버로 보내기 전에 확인합니다. 문제가 있으면 안내 문구를, 없으면 빈 문자열을 돌려줍니다.
export function manualFormError(provider, form) {
  const info = CHANNEL_PROVIDERS[provider]
  if (!info) return '지원하지 않는 채널입니다.'
  if (!String(form.profileUrl || '').trim()) return '채널 주소를 입력해 주세요.'
  const count = String(form.followerCount ?? '').trim()
  if (info.countRequired && !count) return `${info.countLabel}를 입력해 주세요.`
  if (count && !/^\d{1,10}$/.test(count))
    return `${info.countLabel.replace('(선택)', '')}는 숫자로 입력해 주세요.`
  if (!form.file) return '프로필 화면 캡처를 첨부해 주세요.'
  if (!IMAGE_TYPES.includes(form.file.type))
    return '캡처는 JPG 또는 PNG 이미지만 올릴 수 있습니다.'
  if (form.file.size > MAX_EVIDENCE_BYTES)
    return '캡처 이미지는 5MB 이하만 올릴 수 있습니다.'
  return ''
}
