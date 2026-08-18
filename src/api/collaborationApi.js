import api from './axios'
export const getMyCreator=async()=>(await api.get('/creators/me')).data
export const saveCreator=async(data,exists)=>(await api[exists?'put':'post'](exists?'/creators/me':'/creators',data)).data
export const getCreators=async()=>(await api.get('/creators')).data
export const getOpenCampaigns=async()=>(await api.get('/collaborations/campaigns/open')).data
export const getSellerCampaigns=async()=>(await api.get('/collaborations/campaigns/seller')).data
export const createCampaign=async(data)=>(await api.post('/collaborations/campaigns',data)).data
export const applyCampaign=async(id,message)=>(await api.post(`/collaborations/campaigns/${id}/apply`,{message})).data
export const propose=async(data)=>(await api.post('/collaborations/proposals',data)).data
export const getMyCollaborations=async()=>(await api.get('/collaborations/mine')).data
export const getSellerCollaborations=async()=>(await api.get('/collaborations/seller')).data
export const collaborationAction=async(id,action)=>(await api.patch(`/collaborations/${id}/${action}`)).data
export const trackReferral=async(code,data)=>api.post(`/collaborations/referrals/${code}/click`,data)
export const getMyPerformance=async()=>(await api.get('/collaborations/performance/mine')).data
export const getSellerPerformance=async()=>(await api.get('/collaborations/performance/seller')).data
