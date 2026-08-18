import api from './axios'

export const getAdminDashboard = async () => (await api.get('/admin/dashboard')).data
export const getMembers = async () => (await api.get('/members/admin')).data
export const changeMemberStatus = async (id, status) => (await api.patch(`/members/admin/${id}/status`, null, { params: { status } })).data
export const getAdminSettlements = async () => (await api.get('/settlements')).data
export const createAdminSettlement = async (preorderId, platformFeeRate) => (await api.post('/settlements', { preorderId, platformFeeRate })).data
export const confirmAdminSettlement = async (id) => (await api.patch(`/settlements/${id}/confirm`)).data
export const payAdminSettlement = async (id) => (await api.patch(`/settlements/${id}/pay`)).data
export const cancelAdminSettlement = async (id) => (await api.patch(`/settlements/${id}/cancel`)).data
