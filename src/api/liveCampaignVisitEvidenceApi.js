/**
 * 기존 신청 상세와 업체 편집 화면에 사용할 주소 증빙 조회를 활성화합니다.
 * 객체 생성만으로 조회하지 않으며 기록 확인 동작이 요청을 시작합니다.
 */
import authenticated from './axios'
import { createCampaignVisitEvidenceApi } from './campaignVisitEvidenceApi'

export const liveCampaignVisitEvidenceApi = createCampaignVisitEvidenceApi({
  authenticated,
  enabled: true,
})
