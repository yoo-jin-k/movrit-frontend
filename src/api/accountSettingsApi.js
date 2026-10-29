/** 로그인한 회원의 비밀번호와 주소록만 요청합니다. */
import api from './axios'
export const passwordCapability = async () =>
  (await api.get('/members/me/password-capability')).data
// 민감한 변경 요청은 자동 재전송하지 않으며 인증 오류도 폼에서 안내합니다.
export const changePassword = async (data) => {
  const response = await api.patch('/members/me/password', data, {
    skipAuthRefresh: true,
    timeout: 15000,
  })
  if (response.status !== 204) throw new Error('비밀번호 변경 응답 확인 필요')
}
export const listAddresses = async () => {
  const data = (await api.get('/members/me/addresses')).data
  if (!Array.isArray(data)) throw new Error('주소록 응답 오류')
  return data
}
export const saveAddress = (id, data) =>
  id == null
    ? api.post('/members/me/addresses', data, { timeout: 15000 })
    : api.put(`/members/me/addresses/${id}`, data, { timeout: 15000 })
export const deleteAddress = (id) =>
  api.delete(`/members/me/addresses/${id}`, { timeout: 15000 })
export const defaultAddress = (id) =>
  api.patch(`/members/me/addresses/${id}/default`, null, { timeout: 15000 })
