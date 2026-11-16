/**
 * 업체 주문·배송·정산·구매 리뷰(/seller/operations) 조회 결과를 영역별로 나눠 판단합니다(서버 호출 없음).
 * 네 요청 중 하나가 실패해도 나머지 영역은 보여 주고, 실패한 영역만 따로 안내합니다.
 *
 * 변경 이력(고치기 전 → 고친 후)
 * - Promise.all로 묶어 한 요청만 실패해도 '운영 정보를 불러오지 못했습니다.' 경고창이 뜨고 화면 전체가 비어 보임
 *   → 영역별 결과로 나눔. 현재 백엔드(feature/brand)에는 상품 리뷰 API(GET /api/reviews/seller)가 없어 404가 나므로,
 *     404는 '이 서버에서 제공하지 않는 기능'으로 안내하고 오류로 세지 않습니다.
 */
export const OPERATION_SECTIONS = [
  ['orders', '판매 주문'],
  ['shipments', '배송'],
  ['settlements', '정산'],
  ['reviews', '구매 리뷰'],
]

/**
 * results: Promise.allSettled 결과 배열(OPERATION_SECTIONS 순서).
 * 반환: 영역별 { items, state } 와 실패 영역 이름 목록.
 * state: 'ready' | 'unavailable'(404: 서버에 기능 없음) | 'error'(그 밖의 실패·형식 오류)
 */
export function settleOperations(results) {
  const sections = {}
  const failed = []
  OPERATION_SECTIONS.forEach(([key, label], index) => {
    const result = results?.[index]
    if (result?.status === 'fulfilled' && Array.isArray(result.value)) {
      sections[key] = { items: result.value, state: 'ready' }
      return
    }
    const status = result?.reason?.response?.status
    if (status === 404) {
      sections[key] = { items: [], state: 'unavailable' }
      return
    }
    sections[key] = { items: [], state: 'error' }
    failed.push(label)
  })
  return { sections, failed }
}
