import api from './axios'

export const createReview = async (data) =>
  (await api.post('/reviews', data)).data
export const getMyReviews = async () => (await api.get('/reviews/mine')).data
export const getSellerReviews = async () =>
  (await api.get('/reviews/seller')).data
export const getProductReviews = async (productId) =>
  (await api.get(`/reviews/products/${productId}`)).data
export const updateReview = async (reviewId, data) =>
  (await api.put(`/reviews/${reviewId}`, data)).data
export const deleteReview = async (reviewId) =>
  api.delete(`/reviews/${reviewId}`)
export const replyReview = async (reviewId, reply) =>
  (await api.patch(`/reviews/${reviewId}/reply`, { reply })).data
