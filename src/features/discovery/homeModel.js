/**
 * 홈 화면에 쓰는 계산을 모아 둔 파일입니다(화면 없이 단위 테스트할 수 있도록 순수 함수만 둡니다).
 *
 * - 이번 주 표시(예: 11월 첫째 주)
 * - 모집 중 캠페인, 마감이 가까운 순, 선정 확률이 높은 순, 카테고리별 목록
 * - 상단 배너의 '많이 신청한 캠페인' 묶음(한 화면에 2개씩)
 * - 체험 방식 바로가기(배송·방문·구매 후 리뷰·숏폼 영상)의 캠페인 수
 */

/** 홈 카드 묶음 한 줄에 보일 개수입니다(4열 × 2줄). */
export const HOME_SECTION_SIZE = 8

/** 홈 '모집 중인 캠페인'의 카테고리 버튼입니다. */
export const HOME_CATEGORIES = ['전체', '뷰티', '생활', '식품', '맛집', '숙박']

const ORDINALS = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째']

/** 한국 시간 기준으로 '11월 첫째 주'처럼 이번 주를 표시합니다. 주는 일요일에 시작합니다. */
export function weekLabel(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
      .formatToParts(now)
      .map(({ type, value }) => [type, Number(value)]),
  )
  // 그달 1일의 요일(0=일요일)만큼 앞을 채워 몇째 주인지 셉니다.
  const firstWeekday = new Date(
    Date.UTC(parts.year, parts.month - 1, 1),
  ).getUTCDay()
  const week = Math.ceil((parts.day + firstWeekday) / 7)
  return `${parts.month}월 ${ORDINALS[week - 1]} 주`
}

/** 아직 모집이 끝나지 않은 캠페인입니다. 마감일 정보가 없는 캠페인도 모집 중으로 봅니다. */
export function recruitingItems(items) {
  return items.filter(
    (item) =>
      !item.recruitmentEnded && (item.daysLeft == null || item.daysLeft >= 0),
  )
}

/** 마감일이 가까운 순서입니다. 마감일을 알 수 없는 캠페인은 뺍니다. */
export function closingItems(items, size = HOME_SECTION_SIZE) {
  return recruitingItems(items)
    .filter((item) => item.daysLeft != null)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, size)
}

/**
 * 선정 확률이 높은 순서입니다. 모집 인원 대비 신청 수(경쟁률)가 낮을수록 앞에 둡니다.
 * 신청 수나 모집 인원을 모르는 캠페인은 계산할 수 없어 뺍니다.
 * 실제 서버 모드에서는 개발 미리보기 항목을 섞지 않습니다.
 */
export function highChanceItems(items, previewMode, size = HOME_SECTION_SIZE) {
  return recruitingItems(items)
    .filter(
      (item) =>
        item.applicants != null &&
        item.capacity > 0 &&
        (previewMode || !item.preview),
    )
    .sort((a, b) => a.applicants / a.capacity - b.applicants / b.capacity)
    .slice(0, size)
}

/** 카테고리 버튼으로 거른 모집 중 캠페인입니다. '전체'는 거르지 않습니다. */
export function categoryItems(items, category, size = HOME_SECTION_SIZE) {
  return recruitingItems(items)
    .filter((item) => category === '전체' || item.category === category)
    .slice(0, size)
}

/**
 * 상단 배너에 보일 '많이 신청한 캠페인'을 한 화면에 perPage개씩 나눕니다.
 * 신청 수가 많은 순서이며, 신청 수를 모르면 0으로 봅니다. 최대 maxPages 화면입니다.
 */
export function featuredPages(items, perPage = 2, maxPages = 3) {
  const sorted = recruitingItems(items)
    .slice()
    .sort((a, b) => (b.applicants ?? 0) - (a.applicants ?? 0))
    .slice(0, perPage * maxPages)
  const pages = []
  for (let i = 0; i < sorted.length; i += perPage)
    pages.push(sorted.slice(i, i + perPage))
  return pages
}

/**
 * 체험 방식 바로가기에 보일 모집 중 캠페인 수입니다.
 * - delivery: 제품(배송) 캠페인 중 구매평이 아닌 것
 * - visit: 지역(방문) 캠페인
 * - purchase: 구매평(구매 후 리뷰) 캠페인
 * - shortform: 클립 채널 캠페인
 */
export function experienceCounts(items) {
  const open = recruitingItems(items)
  return {
    delivery: open.filter(
      (item) => item.kind === '제품' && !item.shoppingreview,
    ).length,
    visit: open.filter((item) => item.kind === '지역').length,
    purchase: open.filter((item) => item.shoppingreview).length,
    shortform: open.filter((item) => item.media === '클립').length,
  }
}
