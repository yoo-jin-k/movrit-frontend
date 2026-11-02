/**
 * 캠페인 목록·검색 조건을 서버 검색 요청으로 바꾸는 규칙입니다.
 * 실제 데이터는 서버(/api/collaborations/campaigns/search)가 거르고 정렬해 20개씩 나눠 주고,
 * 개발 미리보기(예시 데이터)일 때만 같은 조건을 화면에서 적용합니다.
 */

export const PAGE_SIZE = 20

export const LISTING_SECTIONS = [
  '제품',
  '지역',
  '기자단',
  '오늘오픈',
  '프리미어',
]

const SECTION_TYPES = { 제품: 'PRODUCT', 지역: 'LOCAL', 기자단: 'REPORTER' }

const MEDIA_CODES = {
  블로그: 'BLOG',
  인스타그램: 'INSTAGRAM',
  유튜브: 'YOUTUBE',
  클립: 'CLIP',
  기타: 'OTHER',
}

/**
 * 화면 조건 → 서버 검색 요청 파라미터입니다. 기본값(전체·미디어 전체·전국·최신순)은 보내지 않습니다.
 * page는 화면의 1부터 시작하는 번호를 받아 서버의 0부터 시작하는 번호로 바꿉니다.
 */
export function serverSearchParams({
  search = false,
  section = '제품',
  category = '전체',
  media = '미디어 전체',
  region = '전국',
  sort = 'latest',
  page = 1,
  query = '',
}) {
  const params = { page: Math.max(1, page) - 1, size: PAGE_SIZE }
  if (sort && sort !== 'latest') params.sort = sort
  if (search) {
    if (query.trim()) params.q = query.trim()
    return params
  }
  if (SECTION_TYPES[section]) params.type = SECTION_TYPES[section]
  if (section === '오늘오픈') params.openedToday = true
  if (section === '프리미어') {
    params.premier = true
    // 프리미어의 세부 구분은 채널 기준입니다(인스타그램 프리미어 외에는 블로그).
    if (category !== '전체')
      params.channel = category === '인스타그램 프리미어' ? 'INSTAGRAM' : 'BLOG'
    return params
  }
  if (category !== '전체') params.category = category
  if (MEDIA_CODES[media]) params.channel = MEDIA_CODES[media]
  if (section === '지역' && region !== '전국') params.region = region
  return params
}

// 모집 인원 대비 신청 수(경쟁률)입니다. 신청 0건은 0으로, 신청 수나 모집 인원을 모르면 맨 뒤(Infinity)로 보냅니다.
function competition(item) {
  if (item.applicants == null || !(item.capacity > 0)) return Infinity
  return item.applicants / item.capacity
}

/** 개발 미리보기 전용: 예시 캠페인에 같은 조건을 화면에서 적용합니다. */
export function filterPreviewCampaigns(
  items,
  {
    search = false,
    section = '제품',
    category = '전체',
    media = '미디어 전체',
    region = '전국',
    sort = 'latest',
    query = '',
  },
) {
  const keyword = query.toLocaleLowerCase()
  return items
    .filter((item) => {
      if (search) return item.title.toLocaleLowerCase().includes(keyword)
      if (section === '오늘오픈' && !item.today) return false
      if (section === '프리미어' && !item.premier) return false
      if (['제품', '지역', '기자단'].includes(section) && item.kind !== section)
        return false
      if (
        category !== '전체' &&
        section !== '프리미어' &&
        (section === '지역' ? item.localCategory : item.category) !== category
      )
        return false
      if (
        section === '프리미어' &&
        category !== '전체' &&
        item.media !==
          (category === '인스타그램 프리미어' ? '인스타그램' : '블로그')
      )
        return false
      return (
        (media === '미디어 전체' || item.media === media) &&
        (region === '전국' || item.region === region)
      )
    })
    .sort((a, b) =>
      sort === 'closing'
        ? (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity)
        : sort === 'popular'
          ? (b.applicants || 0) - (a.applicants || 0)
          : sort === 'chance'
            ? competition(a) - competition(b)
            : 0,
    )
}

/** 페이지 번호 버튼 목록입니다. 많으면 현재 페이지 앞뒤 2개와 처음·끝만 보이고 사이는 '…'입니다. */
export function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([
    1,
    total,
    current - 2,
    current - 1,
    current,
    current + 1,
    current + 2,
  ])
  const list = [...pages]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b)
  const result = []
  list.forEach((n, index) => {
    if (index > 0 && n - list[index - 1] > 1) result.push('…')
    result.push(n)
  })
  return result
}
