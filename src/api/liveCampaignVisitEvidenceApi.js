import authenticated from './axios'
import { createCampaignVisitEvidenceApi } from './campaignVisitEvidenceApi'

export const liveCampaignVisitEvidenceApi = createCampaignVisitEvidenceApi({
  authenticated,
  enabled: true,
})
