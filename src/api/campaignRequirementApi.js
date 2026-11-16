/**
 * 캠페인별 참여 조건과 버전을 조회하고 요청한 캠페인의 응답인지 검사합니다.
 * 조회 실패나 잘못된 응답은 조건 없음으로 바꾸지 않고 호출부에 전달합니다.
 */
import api from './axios'
import { validateRequirement } from '../features/sellerCampaigns/requirementModel'
const endpoint = (id) =>
  `/campaigns/${encodeURIComponent(id)}/eligibility-requirement`
export async function readCampaignRequirement(id, signal) {
  const { data } = await api.get(endpoint(id), { signal, timeout: 15000 })
  return validateRequirement(data, id)
}

// 운영자가 캠페인 신청 조건을 정하거나 해제합니다(PUT·DELETE /api/admin/campaigns/{id}/eligibility-requirement).
// 마지막으로 본 조건 버전을 함께 보내며, 업체가 먼저 바꿨다면 서버가 409로 거절합니다.
const adminEndpoint = (id) =>
  `/admin/campaigns/${encodeURIComponent(id)}/eligibility-requirement`
export async function saveAdminCampaignRequirement(
  id,
  payload,
  expectedVersion,
) {
  const { data } = await api.put(
    adminEndpoint(id),
    { ...payload, expectedVersion },
    { timeout: 15000 },
  )
  return data
}
export async function clearAdminCampaignRequirement(id, expectedVersion) {
  await api.delete(adminEndpoint(id), {
    params: { expectedVersion },
    timeout: 15000,
  })
}
