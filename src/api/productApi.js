/**
 * 상품과 상품별 SKU, 입고·안전재고 및 썸네일 업로드를 관리합니다.
 * 상품 ID와 SKU ID의 요청 경로를 구분하며 이미지 업로드는 상품 기본 정보와 별도 요청입니다.
 */
import { fileUploadBody } from './fileUpload.js'
import api from './axios'

export const getMyProducts = async () => (await api.get('/products/mine')).data
export const createProduct = async (data) =>
  (await api.post('/products', data)).data
export const updateProduct = async (productId, data) =>
  (await api.put(`/products/${productId}`, data)).data
export const getVariants = async (productId) =>
  (await api.get(`/products/${productId}/variants`)).data
export const createVariant = async (productId, data) =>
  (await api.post(`/products/${productId}/variants`, data)).data
// 상품 ID가 아닌 SKU ID에 수량을 전송합니다. 입고량과 안전재고 설정은 서로 다른 경로로 처리합니다.
export const restockVariant = async (variantId, quantity) =>
  (await api.patch(`/products/variants/${variantId}/restock`, { quantity }))
    .data
export const updateSafetyStock = async (variantId, quantity) =>
  (
    await api.patch(`/products/variants/${variantId}/safety-stock`, {
      quantity,
    })
  ).data
export const updateVariant = async (variantId, data) =>
  (await api.put(`/products/variants/${variantId}`, data)).data
export const deactivateVariant = async (variantId) =>
  (await api.delete(`/products/variants/${variantId}`)).data
export const deleteProduct = async (productId) =>
  api.delete(`/products/${productId}`)

// 파일 본문과 multipart 헤더 설정만 담당합니다. 업로드 후 상품 목록 재조회는 페이지가 수행합니다.
export const uploadProductThumbnail = async (productId, file) => {
  const formData = fileUploadBody(file)
  const response = await api.post(
    `/products/${productId}/thumbnail`,
    formData,
    {
      headers: { 'Content-Type': undefined },
    },
  )
  return response.data
}
