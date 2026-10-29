/** 승인 업체의 소유 신청 상세만 조회하며 응답의 신청 ID를 다시 확인합니다. */
import api from './axios'
import { validateParticipantDetail } from '../features/business/participantPortfolioModel'
export async function readParticipantPortfolio(applicationId, signal) {
  const { data } = await api.get(
    `/campaigns/applications/${encodeURIComponent(applicationId)}/seller-detail`,
    { signal, timeout: 15000 },
  )
  return validateParticipantDetail(data, applicationId)
}
