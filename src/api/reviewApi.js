/**
 * 구매자·업체·상품별 리뷰 조회와 작성·수정·삭제·업체 답글을 처리합니다.
 * 소유권과 작성 가능 상태는 서버가 확인하며 오류를 호출부에 그대로 전달합니다.
 */
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
// 업체 답글만 별도로 전송합니다. 기존 구매자 리뷰 본문을 수정하는 요청과 구분합니다.
export const replyReview = async (reviewId, reply) =>
  (await api.patch(`/reviews/${reviewId}/reply`, { reply })).data
