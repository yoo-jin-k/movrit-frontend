import api from './axios'

export const getPendingSellers = async () => {
    const response = await api.get('/admin/sellers/pending')
    return response.data
}

export const approveSeller = async (sellerId) => {
    const response = await api.patch(`/admin/sellers/${sellerId}/approve`)
    return response.data
}

export const rejectSeller = async (sellerId) => {
    const response = await api.patch(`/admin/sellers/${sellerId}/reject`)
    return response.data
}
