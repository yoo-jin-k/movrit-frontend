/**
 * SNS 채널 연결 화면의 표시 규칙입니다(화면 없이 테스트할 수 있도록 분리).
 */

// 연결할 수 있는 서비스와 안내 문구입니다. 서버 응답의 provider 값과 같은 이름을 씁니다.
export const CHANNEL_PROVIDERS = {
  instagram: {
    label: '인스타그램',
    hint: '프로페셔널(비즈니스·크리에이터) 계정만 연결됩니다. 팔로워 수를 함께 가져옵니다.',
  },
  youtube: {
    label: '유튜브',
    hint: '유튜브 채널이 있는 Google 계정으로 연결합니다. 구독자 수를 함께 가져옵니다.',
  },
  'naver-blog': {
    label: '네이버 블로그',
    hint: '네이버 아이디로 로그인해 블로그를 확인합니다. 이웃 수는 네이버가 제공하지 않아 가져오지 않습니다.',
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
