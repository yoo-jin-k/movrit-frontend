/** 주문 응답의 표시 형식과 탭 필터 규칙을 관리합니다. */
const ORDER_STATUS_LABELS = {
  PENDING_PAYMENT: '진행중',
  PAID: '결제완료',
  PREPARING: '결제완료',
  SHIPPED: '배송중',
  DELIVERED: '완료',
  CANCELLED: '취소',
  REFUNDED: '취소',
}

export const ORDER_FILTERS = [
  '전체',
  '진행중',
  '결제완료',
  '배송중',
  '완료',
  '취소',
]

/** 이전 응답 필드의 대체 순서와 금액 표시 조건을 그대로 유지합니다. */
export function adaptOrderSummary(order) {
  return {
    id: order.id,
    number: order.orderNumber || order.number,
    title: order.preorderTitle || order.title,
    status: ORDER_STATUS_LABELS[order.status] || order.status,
    date: order.createdAt?.slice(0, 10) || order.date,
    amount: order.totalPaymentAmount
      ? `${Number(order.totalPaymentAmount).toLocaleString()}원`
      : order.amount,
  }
}

/** 전체 탭은 원래 순서를 유지하고, 나머지 탭은 표시 상태로 거릅니다. */
export function filterOrders(orders, filter) {
  return filter === '전체'
    ? orders
    : orders.filter((order) => order.status === filter)
}
