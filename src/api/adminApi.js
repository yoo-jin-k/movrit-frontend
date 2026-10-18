/**
 * 운영자 현황·회원 상태·정산 명령을 인증 클라이언트에 전달합니다.
 * 각 함수는 서버 응답 본문을 반환하며 운영자 권한과 상태 전이 가능 여부는 서버가 판단합니다.
 */
import api from './axios'

export const getAdminDashboard = async () =>
  (await api.get('/admin/dashboard')).data
export const getMembers = async () => (await api.get('/members/admin')).data
// 회원 상태는 쿼리 파라미터로 전달하며 서버가 반환한 상태만 사용합니다.
export const changeMemberStatus = async (id, status) =>
  (await api.patch(`/members/admin/${id}/status`, null, { params: { status } }))
    .data
export const getAdminSettlements = async () =>
  (await api.get('/settlements')).data
// 프리오더 ID와 수수료율로 정산 생성을 요청합니다. 확정·지급·취소는 생성과 분리된 후속 명령입니다.
export const createAdminSettlement = async (preorderId, platformFeeRate) =>
  (await api.post('/settlements', { preorderId, platformFeeRate })).data
export const confirmAdminSettlement = async (id) =>
  (await api.patch(`/settlements/${id}/confirm`)).data
export const payAdminSettlement = async (id) =>
  (await api.patch(`/settlements/${id}/pay`)).data
export const cancelAdminSettlement = async (id) =>
  (await api.patch(`/settlements/${id}/cancel`)).data
