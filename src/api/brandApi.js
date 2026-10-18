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
