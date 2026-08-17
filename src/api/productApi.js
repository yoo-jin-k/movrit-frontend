import api from './axios'

export const getMyProducts = async () => (await api.get('/products/mine')).data
export const createProduct = async (data) => (await api.post('/products', data)).data
export const updateProduct = async (productId, data) => (await api.put(`/products/${productId}`, data)).data
export const getVariants = async (productId) => (await api.get(`/products/${productId}/variants`)).data
export const createVariant = async (productId, data) => (await api.post(`/products/${productId}/variants`, data)).data
export const restockVariant = async (variantId, quantity) => (await api.patch(`/products/variants/${variantId}/restock`, { quantity })).data
export const updateSafetyStock = async (variantId, quantity) => (await api.patch(`/products/variants/${variantId}/safety-stock`, { quantity })).data

export const uploadProductThumbnail = async (productId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post(`/products/${productId}/thumbnail`, formData, {
        headers: { 'Content-Type': undefined },
    })
    return response.data
}
