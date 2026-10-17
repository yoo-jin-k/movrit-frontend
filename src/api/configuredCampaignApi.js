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
