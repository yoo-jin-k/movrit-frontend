/**
 * 내 프리오더의 생성·수정·단계별 상태 전이·삭제 요청을 전달합니다.
 * 이 모듈은 허용 상태를 자체 판정하지 않으며 최종 전이 가능 여부와 결과는 서버에 맡깁니다.
 */
import api from './axios'

// 판매자가 등록한 프리오더 목록을 조회합니다.
export const getMyPreorders = async () =>
  (await api.get('/preorders/mine')).data

// 프리오더 생성을 요청합니다. 생성 상태는 서버 응답으로 확인합니다.
export const createPreorder = async (data) =>
  (await api.post('/preorders', data)).data

// 프리오더 수정을 요청합니다. 수정 가능한 상태는 서버가 확인합니다.
export const updatePreorder = async (id, data) =>
  (await api.put(`/preorders/${id}`, data)).data

// 각 업무 단계의 상태 전이를 별도 API로 요청합니다.
export const schedulePreorder = async (id) =>
  (await api.patch(`/preorders/${id}/schedule`)).data
export const openPreorder = async (id) =>
  (await api.patch(`/preorders/${id}/open`)).data
export const closePreorder = async (id) =>
  (await api.patch(`/preorders/${id}/close`)).data
export const finalizePreorder = async (id) =>
  (await api.patch(`/preorders/${id}/finalize`)).data
export const cancelPreorder = async (id, reason) =>
  (await api.patch(`/preorders/${id}/cancel`, { reason })).data
export const startProduction = async (id) =>
  (await api.patch(`/preorders/${id}/production`)).data
export const startShipping = async (id) =>
  (await api.patch(`/preorders/${id}/shipping`)).data
export const completePreorder = async (id) =>
  (await api.patch(`/preorders/${id}/complete`)).data

// 삭제를 요청하며 삭제 가능한 업무 상태는 서버가 확인합니다.
export const deletePreorder = async (id) => api.delete(`/preorders/${id}`)
