/**
 * 배송 관리 API입니다: 배송지·송장 목록, 송장 일괄 저장, 배송지 엑셀 내려받기, 참여자 발송 정보.
 */
import api from './axios'
import { downloadFile } from './downloadFile'

const campaign = (id) => `/campaigns/${encodeURIComponent(id)}/shipping`

export async function readCouriers() {
  const { data } = await api.get('/campaigns/shipping/couriers', {
    timeout: 15000,
  })
  return Array.isArray(data) ? data : []
}

export async function readShippingRows(campaignId, signal) {
  const { data } = await api.get(campaign(campaignId), {
    signal,
    timeout: 15000,
  })
  if (!Array.isArray(data)) throw new Error('배송 목록을 확인할 수 없습니다.')
  return data
}

// 여러 참여자의 송장을 저장합니다. 건별 성공·실패 사유가 돌아옵니다.
export async function saveShipments(campaignId, shipments) {
  const { data } = await api.put(
    campaign(campaignId),
    { shipments },
    { timeout: 30000 },
  )
  return data
}

// 배송지 엑셀(.xlsx)을 받아 브라우저 저장 창을 엽니다. 파일 이름은 서버가 정한 이름을 씁니다.
export async function downloadShippingExcel(campaignId) {
  return downloadFile(`${campaign(campaignId)}/export`, {
    fallbackName: `배송지_캠페인${campaignId}.xlsx`,
  })
}

// 참여자·업체가 보는 발송 정보입니다. 아직 발송 전이면 null입니다(서버 204).
export async function readShipment(applicationId, signal) {
  const response = await api.get(
    `/campaigns/applications/${encodeURIComponent(applicationId)}/shipment`,
    { signal, timeout: 15000 },
  )
  return response.status === 204 || !response.data ? null : response.data
}
