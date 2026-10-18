/**
 * 서버에 저장된 프리오더 찜 목록과 추가·삭제·상태 조회를 처리합니다.
 * 개발용 캠페인 찜 저장소와 별개이며, 실패 시 로컬 찜 상태를 임의로 성공 처리하지 않습니다.
 */
import api from './axios'

export const getFavoritePreorders = async () =>
  (await api.get('/favorites/preorders')).data
export const addFavoritePreorder = async (preorderId) =>
  (await api.post(`/favorites/preorders/${preorderId}`)).data
// 삭제 응답 전체를 반환하므로 호출 화면은 성공 여부를 기다린 뒤 로컬 목록을 갱신합니다.
export const removeFavoritePreorder = async (preorderId) =>
  api.delete(`/favorites/preorders/${preorderId}`)
export const getFavoriteStatus = async (preorderId) =>
  (await api.get(`/favorites/preorders/${preorderId}/status`)).data
