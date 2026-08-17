import api from './axios'

// 판매자가 등록한 프리오더 목록을 조회한다.
export const getMyPreorders = async () => (await api.get('/preorders/mine')).data

// 프리오더 초안을 생성한다. 생성 직후 상태는 DRAFT다.
export const createPreorder = async (data) => (await api.post('/preorders', data)).data

// DRAFT/SCHEDULED 상태에서 프리오더 정보를 수정한다.
export const updatePreorder = async (id, data) => (await api.put(`/preorders/${id}`, data)).data

// 프리오더 상태 전이 API들이다.
export const schedulePreorder = async (id) => (await api.patch(`/preorders/${id}/schedule`)).data
export const openPreorder = async (id) => (await api.patch(`/preorders/${id}/open`)).data
export const closePreorder = async (id) => (await api.patch(`/preorders/${id}/close`)).data
export const finalizePreorder = async (id) => (await api.patch(`/preorders/${id}/finalize`)).data
export const cancelPreorder = async (id, reason) => (await api.patch(`/preorders/${id}/cancel`, { reason })).data

// 아직 판매를 시작하지 않은 초안은 삭제할 수 있다.
export const deletePreorder = async (id) => api.delete(`/preorders/${id}`)
