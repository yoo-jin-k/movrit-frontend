import api from './axios'

export const applyCreator = (payload) => api.post('/creators/apply', payload)
export const getMyCreatorProfile = () => api.get('/creators/me')
export const updateMyCreatorProfile = (payload) =>
  api.put('/creators/me', payload)
export const getCreatorDashboard = () => api.get('/creators/me/dashboard')
export const updateCreatorCampaignStatus = (campaignId, status) =>
  api.patch(`/creators/me/campaigns/${campaignId}/status`, { status })
