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
