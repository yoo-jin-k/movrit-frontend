import api from './axios'

export const getMyPreorders = async () => (await api.get('/preorders/mine')).data
export const createPreorder = async (data) => (await api.post('/preorders', data)).data
export const updatePreorder = async (id, data) => (await api.put(`/preorders/${id}`, data)).data
export const schedulePreorder = async (id) => (await api.patch(`/preorders/${id}/schedule`)).data
export const openPreorder = async (id) => (await api.patch(`/preorders/${id}/open`)).data
export const closePreorder = async (id) => (await api.patch(`/preorders/${id}/close`)).data
export const finalizePreorder = async (id) => (await api.patch(`/preorders/${id}/finalize`)).data
export const cancelPreorder = async (id, reason) => (await api.patch(`/preorders/${id}/cancel`, { reason })).data
