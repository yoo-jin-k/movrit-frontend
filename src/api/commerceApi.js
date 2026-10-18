/**
 * 프리오더 조회부터 주문·결제·배송·정산까지 기존 업무 API 호출을 제공합니다.
 * 화면이 선택한 명령을 전달할 뿐 결제나 배송 성공을 로컬에서 확정하지 않습니다.
 * 결제 생성의 멱등 키는 함수 호출마다 생성되므로 호출 간 재시도 키 보존 기능은 아닙니다.
 */
import api from './axios'

export const getOpenPreorders = async () =>
  (await api.get('/preorders/open')).data
// 호출부가 구성한 검색 조건을 쿼리로 전달하고 검색 결과 본문을 반환합니다.
export const browsePreorders = async (params = {}) =>
  (await api.get('/preorders/browse', { params })).data
// 주문 폼과 요청 식별자는 호출 화면이 구성합니다. 여기서는 본문을 그대로 서버에 전달합니다.
export const createOrder = async (data) =>
  (await api.post('/orders', data)).data
export const getMyOrders = async () => (await api.get('/orders/mine')).data
export const getSellerOrders = async () =>
  (await api.get('/orders/seller')).data
export const updateOrderReceiver = async (id, data) =>
  (await api.put(`/orders/${id}/receiver`, data)).data
export const cancelOrder = async (id) =>
  (await api.patch(`/orders/${id}/cancel`)).data

// 결제 생성 요청마다 UUID 멱등 키를 생성합니다. 이후 승인·실패·환불은 별도 명령입니다.
export const createPayment = async (orderId) =>
  (
    await api.post('/payments', {
      orderId,
      idempotencyKey: crypto.randomUUID(),
    })
  ).data
export const getMyPayments = async () => (await api.get('/payments/mine')).data
export const approvePayment = async (id, data) =>
  (await api.patch(`/payments/${id}/approve`, data)).data
export const failPayment = async (id, data) =>
  (await api.patch(`/payments/${id}/fail`, data)).data
export const refundPayment = async (id) =>
  (await api.patch(`/payments/${id}/refund`)).data

export const getShipments = async () => (await api.get('/shipments/mine')).data
export const getBuyerShipments = async () =>
  (await api.get('/shipments/buyer')).data
// 주문 ID로 배송 건을 만든 뒤 준비·발송·완료는 배송 ID를 대상으로 별도 처리합니다.
export const createShipment = async (orderId) =>
  (await api.post(`/shipments/orders/${orderId}`)).data
export const prepareShipment = async (id) =>
  (await api.patch(`/shipments/${id}/prepare`)).data
export const shipShipment = async (id, data) =>
  (await api.patch(`/shipments/${id}/ship`, data)).data
export const deliverShipment = async (id) =>
  (await api.patch(`/shipments/${id}/deliver`)).data

// 업체 본인 정산 목록입니다. 관리자 전체 목록 조회와 경로를 구분합니다.
export const getSettlements = async () =>
  (await api.get('/settlements/mine')).data
export const createSettlement = async (data) =>
  (await api.post('/settlements', data)).data
export const confirmSettlement = async (id) =>
  (await api.patch(`/settlements/${id}/confirm`)).data
export const paySettlement = async (id) =>
  (await api.patch(`/settlements/${id}/pay`)).data
export const cancelSettlement = async (id) =>
  (await api.patch(`/settlements/${id}/cancel`)).data
