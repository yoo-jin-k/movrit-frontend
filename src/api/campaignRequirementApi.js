import api from './axios'
import { validateRequirement } from '../features/sellerCampaigns/requirementModel'
const endpoint = (id) =>
  `/campaigns/${encodeURIComponent(id)}/eligibility-requirement`
export async function readCampaignRequirement(id, signal) {
  const { data } = await api.get(endpoint(id), { signal, timeout: 15000 })
  return validateRequirement(data, id)
}
