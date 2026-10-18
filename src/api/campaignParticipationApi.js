/**
 * 캠페인 참여 가능 여부를 인증된 서버 판정으로 조회합니다.
 * 응답의 캠페인과 상태를 검증하며 프로필 수치만으로 신청 가능 여부를 추측하지 않습니다.
 */
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
