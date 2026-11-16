/**
 * 운영자 '업체 관리' 목록(/admin/sellers)의 정리·검색·정렬 규칙과 왼쪽 메뉴의 심사 대기 배지 문구입니다.
 * 화면 없이 테스트할 수 있도록 분리했습니다.
 *
 * - 서버 API: GET /api/admin/sellers?sort=newest|oldest|name (운영자 전용)
 * - 서버가 정렬을 지원하지 않는 이전 버전이어도 같은 순서가 되도록 화면에서도 한 번 더 정렬합니다.
 * - 신청일이 없는 응답(이전 서버)은 번호 순으로 대신 정렬하고 신청일은 '-'로 보여줍니다.
 */

export const SELLER_STATUS_LABELS = {
  PENDING: '심사 대기',
  APPROVED: '승인',
  REJECTED: '반려',
}

export const SELLER_STATUS_CHIPS = [
  ['', '전체'],
  ['PENDING', '심사 대기'],
  ['APPROVED', '승인'],
  ['REJECTED', '반려'],
]

export const SELLER_SORTS = [
  ['newest', '신청일 최신순'],
  ['oldest', '신청일 오래된순'],
  ['name', '업체명순'],
]

const SORT_VALUES = SELLER_SORTS.map(([value]) => value)

/** 정렬 값이 목록에 없으면 기본값(최신순)으로 바꿉니다. */
export function sellerSortValue(value) {
  return SORT_VALUES.includes(value) ? value : 'newest'
}

/** 목록 조회 주소입니다. 정렬 값은 정해진 목록 안에서만 보냅니다. */
export function sellerListPath(sort) {
  return `/admin/sellers?sort=${sellerSortValue(sort)}`
}

/**
 * 서버 응답을 화면 행으로 바꿉니다. 배열이 아니면 null을 돌려 '형식 확인 불가' 오류로 다루게 합니다.
 */
export function sellerRows(data) {
  if (!Array.isArray(data)) return null
  return data
    .filter((item) => item && item.id != null)
    .map((item) => ({
      id: item.id,
      businessName: item.businessName || '-',
      brandName: item.brandName || '',
      representativeName: item.representativeName || '-',
      businessNumber: item.businessNumber || '-',
      status: item.status,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
    }))
}

/** 상태별 건수입니다. 칩 이름 옆에 붙입니다. */
export function sellerStatusCounts(rows = []) {
  const counts = { '': rows.length, PENDING: 0, APPROVED: 0, REJECTED: 0 }
  rows.forEach((row) => {
    if (row.status in counts) counts[row.status] += 1
  })
  return counts
}

// 신청일 비교 값입니다. 서버 시각 문자열(YYYY-MM-DDTHH:mm:ss)은 글자 순서가 곧 시간 순서입니다.
const createdKey = (row) => row.createdAt || ''

/** 정렬합니다. 같은 신청일·같은 이름이면 번호로 순서를 고정합니다. 원본 배열은 바꾸지 않습니다. */
export function sortSellers(rows = [], sort = 'newest') {
  const value = sellerSortValue(sort)
  const byId = (a, b) => Number(a.id) - Number(b.id)
  return [...rows].sort((a, b) => {
    if (value === 'name')
      return (
        String(a.businessName).localeCompare(String(b.businessName), 'ko') ||
        byId(a, b)
      )
    const compared =
      createdKey(a) === createdKey(b)
        ? byId(a, b)
        : createdKey(a) < createdKey(b)
          ? -1
          : 1
    return value === 'oldest' ? compared : -compared
  })
}

/** 상태 칩·검색어(상호·브랜드·대표자·사업자번호)·정렬을 한 번에 적용합니다. */
export function visibleSellers(rows = [], { status = '', search = '', sort }) {
  const query = search.trim().toLowerCase()
  const digits = query.replace(/[^0-9]/g, '')
  const filtered = rows.filter((row) => {
    if (status && row.status !== status) return false
    if (!query) return true
    const text =
      `${row.businessName} ${row.brandName} ${row.representativeName} ${row.businessNumber}`.toLowerCase()
    // 사업자번호는 '-' 없이 숫자만 입력해도 찾습니다.
    return (
      text.includes(query) ||
      (digits.length >= 3 &&
        String(row.businessNumber)
          .replace(/[^0-9]/g, '')
          .includes(digits))
    )
  })
  return sortSellers(filtered, sort)
}

/** 왼쪽 메뉴 배지 문구입니다. 0건·알 수 없음이면 빈 문자열(배지 없음), 99건을 넘으면 '99+'입니다. */
export function pendingBadgeText(count) {
  if (!Number.isSafeInteger(count) || count <= 0) return ''
  return count > 99 ? '99+' : String(count)
}

/** 심사 대기 목록 응답에서 건수를 셉니다. 배열이 아니면 알 수 없음(null)입니다. */
export function pendingCountFrom(data) {
  return Array.isArray(data) ? data.length : null
}
