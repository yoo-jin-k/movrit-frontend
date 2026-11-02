/**
 * 구매평 캠페인 API입니다. 결제·송금은 하지 않고 구매 안내·구매 인증·환급 완료 기록만 다룹니다.
 */
import api from './axios'

// 구매 안내(구매처·판매가·환급액)입니다. 아직 등록하지 않았으면 null입니다.
export async function readPurchaseInfo(campaignId, signal) {
  try {
    const { data } = await api.get(
      `/collaborations/campaigns/${encodeURIComponent(campaignId)}/purchase-review`,
      { signal, timeout: 15000 },
    )
    return data
  } catch (failure) {
    if (failure.response?.status === 404) return null
    throw failure
  }
}

// 업체가 구매 안내를 저장합니다.
export async function savePurchaseInfo(campaignId, body) {
  const { data } = await api.put(
    `/campaigns/${encodeURIComponent(campaignId)}/purchase-review`,
    body,
    { timeout: 15000 },
  )
  return data
}

// 참여자가 구매 인증을 제출합니다(다시 내면 고쳐집니다).
export async function submitPurchaseProof(
  applicationId,
  { orderNumber, paidAmount, file },
) {
  const form = new FormData()
  form.append('orderNumber', String(orderNumber).trim())
  form.append('paidAmount', String(Number(paidAmount)))
  form.append('evidence', file)
  const { data } = await api.post(
    `/campaigns/applications/${encodeURIComponent(applicationId)}/purchase-proof`,
    form,
    { headers: { 'Content-Type': undefined }, timeout: 30000 },
  )
  return data
}

// 구매 인증·환급 상태입니다. 아직 제출하지 않았으면 null입니다(서버 204).
export async function readPurchaseProof(applicationId, signal) {
  const response = await api.get(
    `/campaigns/applications/${encodeURIComponent(applicationId)}/purchase-proof`,
    { signal, timeout: 15000 },
  )
  return response.status === 204 || !response.data ? null : response.data
}

// 주문 내역 캡처는 공개 주소가 없어 로그인 요청으로 받아 임시 주소로 보여줍니다.
export async function readPurchaseEvidence(applicationId, signal) {
  const { data } = await api.get(
    `/campaigns/applications/${encodeURIComponent(applicationId)}/purchase-proof/evidence`,
    { responseType: 'blob', signal, timeout: 30000 },
  )
  return data
}

// 업체가 환급 완료를 기록합니다(실제 송금은 업체가 직접 합니다).
export async function recordPayback(applicationId, note) {
  const { data } = await api.patch(
    `/campaigns/applications/${encodeURIComponent(applicationId)}/payback`,
    { note: note?.trim() || null },
    { timeout: 15000 },
  )
  return data
}
