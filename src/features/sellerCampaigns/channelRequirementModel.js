/**
 * 콘텐츠 채널별 기본 제출 요건입니다. 캠페인 작성 화면의 '채널 기본 요건 넣기'에서 씁니다.
 * 비어 있는 칸(제출 요구사항·채널별 작성 안내)만 채우고, 업체가 이미 적은 내용은 바꾸지 않습니다.
 * 넣은 뒤에는 업체가 자유롭게 고칠 수 있습니다.
 */
export const CHANNEL_DEFAULTS = {
  BLOG: {
    submissionRequirement: [
      '· 본문 1,000자 이상, 직접 찍은 사진 10장 이상',
      '· 제목과 본문에 브랜드명·제품명(또는 매장명) 포함',
      '· 업체가 안내한 키워드를 본문에 자연스럽게 2회 이상 사용',
      '· 체험 제공 사실을 본문에 표기(공정위 표시 문구)',
      '· 게시 후 최소 6개월 동안 유지',
    ].join('\n'),
    channelGuide:
      '전체 공개 글로 올려 주세요. 지도(방문형)나 구매처 링크(제품형)를 함께 넣어 주시면 좋습니다.',
  },
  INSTAGRAM: {
    submissionRequirement: [
      '· 피드 게시물 1개(사진 3장 이상 또는 릴스 15초 이상)',
      '· 브랜드 계정 태그와 업체가 안내한 해시태그 포함',
      "· 본문 첫 줄 또는 '유료 광고 포함' 표시로 체험 제공 사실 표기",
      '· 게시 후 최소 6개월 동안 유지(보관·숨김 금지)',
    ].join('\n'),
    channelGuide:
      '계정은 공개 상태여야 합니다. 스토리만 올리는 것은 제출로 인정되지 않습니다.',
  },
  YOUTUBE: {
    submissionRequirement: [
      '· 1분 이상 영상 1개(쇼츠는 업체와 협의한 경우만)',
      '· 제목 또는 설명란에 브랜드명·제품명 포함',
      "· 영상 안 또는 설명란에 '유료 광고 포함' 표시",
      '· 공개 상태로 최소 6개월 유지',
    ].join('\n'),
    channelGuide:
      '설명란 첫 줄에 구매처 또는 매장 정보를 적어 주세요. 미등록·일부 공개 영상은 제출로 인정되지 않습니다.',
  },
  CLIP: {
    submissionRequirement: [
      '· 15초 이상 세로 영상 1개',
      '· 브랜드명·제품명(또는 매장명)과 업체가 안내한 해시태그 포함',
      '· 체험 제공 사실 표기',
      '· 게시 후 최소 6개월 동안 유지',
    ].join('\n'),
    channelGuide:
      '첫 3초 안에 제품이나 매장이 보이도록 촬영해 주세요. 배경 음악은 플랫폼에서 제공하는 음원만 써 주세요.',
  },
}

export function hasChannelDefaults(channel) {
  return Object.hasOwn(CHANNEL_DEFAULTS, channel || '')
}

// 비어 있는 칸만 채운 새 값과, 채운 칸 이름 목록을 돌려줍니다.
export function applyChannelDefaults(value) {
  const defaults = CHANNEL_DEFAULTS[value?.contentChannel]
  if (!defaults) return { next: value, filled: [] }
  const next = { ...value }
  const filled = []
  for (const [field, text] of Object.entries(defaults)) {
    if (!String(value[field] ?? '').trim()) {
      next[field] = text
      filled.push(field)
    }
  }
  return { next, filled }
}
