/**
 * 내 브랜드 정보와 상태, 로고·커버 파일을 각각의 API로 관리합니다.
 * 기본 정보 저장과 이미지 업로드는 별도 요청이므로 여러 호출을 하나의 원자 저장으로 취급하지 않습니다.
 */
import { fileUploadBody } from './fileUpload.js'
import api from './axios'

export const getMyBrands = async () => {
  const response = await api.get('/brands/mine')
  return response.data
}

export const createBrand = async (data) => {
  const response = await api.post('/brands', data)
  return response.data
}

export const updateBrand = async (brandId, data) => {
  const response = await api.put(`/brands/${brandId}`, data)
  return response.data
}

// logo 또는 cover 경로에 파일을 보내는 공통 함수입니다.
// JSON 기본 헤더를 해제하여 브라우저가 multipart boundary를 구성하게 합니다.
const uploadBrandImage = async (brandId, type, file) => {
  const formData = fileUploadBody(file)

  const response = await api.post(`/brands/${brandId}/${type}`, formData, {
    // 브라우저가 multipart boundary를 직접 붙이도록 Content-Type을 강제로 지정하지 않습니다.
    headers: { 'Content-Type': undefined },
  })
  return response.data
}

export const uploadBrandLogo = (brandId, file) =>
  uploadBrandImage(brandId, 'logo', file)
export const uploadBrandCover = (brandId, file) =>
  uploadBrandImage(brandId, 'cover', file)

export const changeBrandStatus = async (brandId, status) => {
  const response = await api.patch(`/brands/${brandId}/status`, null, {
    params: { status },
  })
  return response.data
}

export const deleteBrand = async (brandId) => api.delete(`/brands/${brandId}`)
