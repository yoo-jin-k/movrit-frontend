/**
 * 캠페인 본문·조건·신청 폼·표시정보를 configured 저장 요청으로 전달합니다.
 * ID가 있으면 수정하고 없으면 생성하며, 응답에 캠페인 ID가 없으면 저장 성공을 확정하지 않습니다.
 */
import api from './axios'
export async function saveConfiguredCampaign(payload, campaignId) {
  const response = campaignId
    ? await api.patch(
        `/campaigns/configured/${encodeURIComponent(campaignId)}`,
        payload,
        { timeout: 15000 },
      )
    : await api.post('/campaigns/configured', payload, { timeout: 15000 })
  if (!response.data?.campaign?.id)
    throw new Error('저장 결과를 확인할 수 없습니다.')
  return response.data
}
