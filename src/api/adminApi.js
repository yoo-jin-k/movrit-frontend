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
  (
    await api.patch(`/members/admin/${id}/status`, undefined, {
      params: { status },
    })
  ).data
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

// 운영자 화면 공용 조회입니다(useAdminResource). 경로는 화면이 정하고, 403·404 구분은 호출부가 합니다.
export async function readAdminResource(path, signal) {
  const { data } = await api.get(path, { signal, timeout: 15000 })
  return data
}

// 정산 확정·지급·취소를 한 곳에서 고릅니다. 지원하지 않는 처리는 요청 전에 막습니다.
const SETTLEMENT_COMMANDS = {
  confirm: confirmAdminSettlement,
  pay: payAdminSettlement,
  cancel: cancelAdminSettlement,
}
export async function actOnAdminSettlement(id, action) {
  const command = SETTLEMENT_COMMANDS[action]
  if (!command) throw new Error('지원하지 않는 정산 처리입니다.')
  return command(id)
}

// 캠페인 숨기기(close, 사유 필수)·다시 공개(reopen)입니다.
export async function changeAdminCampaignVisibility(id, action, reason) {
  if (!['close', 'reopen'].includes(action))
    throw new Error('지원하지 않는 캠페인 처리입니다.')
  const { data } = await api.patch(
    `/admin/campaigns/${id}/${action}`,
    action === 'close' ? { reason: reason.trim() } : undefined,
    { timeout: 15000 },
  )
  return data
}

// 운영자 참여자 선정·미선정입니다. 선정 방식·상태·정원은 서버가 다시 확인합니다(403·409).
export async function decideAdminCampaignApplication(id, action) {
  if (!['select', 'reject'].includes(action))
    throw new Error('지원하지 않는 선정 처리입니다.')
  const { data } = await api.patch(
    `/admin/campaign-applications/${id}/${action}`,
    undefined,
    { timeout: 15000 },
  )
  return data
}

// 운영자 콘텐츠 최종 승인·수정 요청입니다. 다른 화면에서 먼저 처리했으면 409입니다.
export async function reviewAdminCampaignContent(id, action, payload) {
  if (!['approve', 'request-revision'].includes(action))
    throw new Error('지원하지 않는 콘텐츠 처리입니다.')
  const { data } = await api.patch(
    `/admin/campaign-contents/${id}/${action}`,
    payload,
    { timeout: 15000 },
  )
  return data
}

// 공지 등록(id 없음)·수정·삭제입니다.
export async function saveAdminNotice(id, form) {
  const { data } = id
    ? await api.put(`/admin/notices/${id}`, form)
    : await api.post('/admin/notices', form)
  return data
}
export async function deleteAdminNotice(id) {
  await api.delete(`/admin/notices/${id}`)
}
