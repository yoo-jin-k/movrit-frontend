import api from './axios'

export const getFavoritePreorders = async () => (await api.get('/favorites/preorders')).data
export const addFavoritePreorder = async (preorderId) => (await api.post(`/favorites/preorders/${preorderId}`)).data
export const removeFavoritePreorder = async (preorderId) => api.delete(`/favorites/preorders/${preorderId}`)
export const getFavoriteStatus = async (preorderId) => (await api.get(`/favorites/preorders/${preorderId}/status`)).data
