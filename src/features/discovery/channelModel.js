/**
 * 콘텐츠 채널 이름표입니다. 서버 코드(INSTAGRAM)와 화면 이름(인스타그램)을 같은 키로 맞춥니다.
 * 아이콘(ChannelIcon)·카드·목록 필터가 같은 이름을 쓰도록 한 곳에 둡니다.
 */

// 서버 코드(INSTAGRAM 등)와 화면 이름(인스타그램 등)을 모두 받아 같은 키로 맞춥니다.
export const CHANNELS = {
  instagram: { label: '인스타그램', aliases: ['INSTAGRAM', '인스타그램'] },
  blog: { label: '블로그', aliases: ['BLOG', '블로그', '네이버 블로그'] },
  youtube: { label: '유튜브', aliases: ['YOUTUBE', '유튜브'] },
  clip: { label: '클립', aliases: ['CLIP', '클립'] },
  other: { label: '기타', aliases: ['OTHER', '기타'] },
}

/** 서버 코드나 화면 이름을 아이콘 키(instagram·blog·youtube·clip·other)로 바꿉니다. 알 수 없으면 null입니다. */
export function channelKey(value) {
  if (!value) return null
  const found = Object.entries(CHANNELS).find(([, channel]) =>
    channel.aliases.includes(value),
  )
  return found ? found[0] : null
}

/** 아이콘 키나 서버 코드를 화면에 보일 채널 이름으로 바꿉니다. */
export function channelLabel(value) {
  const key = CHANNELS[value] ? value : channelKey(value)
  return key ? CHANNELS[key].label : ''
}
