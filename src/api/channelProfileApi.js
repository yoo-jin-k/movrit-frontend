import api from './axios'
import { validateChannelProfile } from '../features/membership/channelProfileModel'
const endpoint = '/users/me/channel-profile'
export async function readChannelProfile(signal) {
  const { data } = await api.get(endpoint, { signal, timeout: 15000 })
  return validateChannelProfile(data)
}
export async function saveChannelMetric(request) {
  const { data } = await api.put(endpoint, request, { timeout: 15000 })
  return validateChannelProfile(data)
}
