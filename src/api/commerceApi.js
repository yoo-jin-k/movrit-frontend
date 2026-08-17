import api from './axios'

export const getOpenPreorders = async () => (await api.get('/preorders/open')).data
export const createOrder = async (data) => (await api.post('/orders', data)).data
export const getMyOrders = async () => (await api.get('/orders/mine')).data
export const getSellerOrders = async () => (await api.get('/orders/seller')).data
export const updateOrderReceiver = async (id, data) => (await api.put(`/orders/${id}/receiver`, data)).data
export const cancelOrder = async (id) => (await api.patch(`/orders/${id}/cancel`)).data

export const createPayment = async (orderId) => (await api.post('/payments', {
    orderId,
    idempotencyKey: crypto.randomUUID(),
})).data
export const getMyPayments = async () => (await api.get('/payments/mine')).data
export const approvePayment = async (id, data) => (await api.patch(`/payments/${id}/approve`, data)).data
export const failPayment = async (id, data) => (await api.patch(`/payments/${id}/fail`, data)).data
export const refundPayment = async (id) => (await api.patch(`/payments/${id}/refund`)).data

export const getShipments = async () => (await api.get('/shipments/mine')).data
export const createShipment = async (orderId) => (await api.post(`/shipments/orders/${orderId}`)).data
export const prepareShipment = async (id) => (await api.patch(`/shipments/${id}/prepare`)).data
export const shipShipment = async (id, data) => (await api.patch(`/shipments/${id}/ship`, data)).data
export const deliverShipment = async (id) => (await api.patch(`/shipments/${id}/deliver`)).data

export const getSettlements = async () => (await api.get('/settlements/mine')).data
export const createSettlement = async (data) => (await api.post('/settlements', data)).data
export const confirmSettlement = async (id) => (await api.patch(`/settlements/${id}/confirm`)).data
export const paySettlement = async (id) => (await api.patch(`/settlements/${id}/pay`)).data
export const cancelSettlement = async (id) => (await api.patch(`/settlements/${id}/cancel`)).data
