import api from './axios'
import { validateEligibility } from '../features/discovery/eligibilityModel'

// 신청 허용 여부는 인증된 서버 응답으로만 판단합니다.
export async function readCampaignEligibility(campaignId, signal) {
  const { data } = await api.get(`/campaigns/${campaignId}/eligibility`, {
    signal,
    timeout: 15000,
  })
  return validateEligibility(data, campaignId)
}
