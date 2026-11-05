/**
 * 구매평 캠페인 화면 규칙입니다.
 *
 * 구매평 캠페인은 참여자가 구매처(네이버 스마트스토어·쿠팡 등)에서 직접 결제해 상품을 사고,
 * 구매처에 구매평을 남기면 브랜드가 약속한 금액을 돌려주는(환급·페이백) 방식입니다.
 * MOVRIT은 결제·송금을 대신하지 않고, 구매 인증과 환급 완료 여부만 기록합니다.
 *
 * 진행 순서: 신청 → 선정(참여 중) → 구매 인증 제출 → 구매평 링크 제출 → 검토·승인(완료) → 브랜드 환급 → 환급 완료 기록
 */

// 신청서 참여 방식 이름입니다. 구매형(PURCHASE)은 구매평 캠페인에서만 씁니다.
export const FULFILLMENT_LABELS = {
  DELIVERY: '배송형',
  VISIT: '방문형',
  PURCHASE: '직접 구매',
}
export const fulfillmentLabel = (type) =>
  FULFILLMENT_LABELS[type] || '미지원 유형'

// 캠페인 종류에 따라 고를 수 있는 참여 방식입니다.
export const fulfillmentOptions = (campaignType) =>
  campaignType === 'PURCHASE_REVIEW' ? ['PURCHASE'] : ['DELIVERY', 'VISIT']

// 캠페인 종류를 바꿀 때 신청서 참여 방식을 그 종류에 맞게 고칩니다(구매평 ↔ 다른 종류).
export function fulfillmentForType(campaignType, current = []) {
  const allowed = fulfillmentOptions(campaignType)
  const kept = current.filter((type) => allowed.includes(type))
  if (campaignType === 'PURCHASE_REVIEW') return ['PURCHASE']
  return kept
}

export const PAYBACK_LABELS = { PENDING: '환급 대기', PAID: '환급 완료' }

// 금액 표시입니다(예: 12,900원).
export function won(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? `${amount.toLocaleString('ko-KR')}원` : '-'
}

export const emptyPurchaseInfo = () => ({
  storeName: '',
  productUrl: '',
  productPrice: '',
  paybackAmount: '',
  purchaseGuide: '',
})

// 서버 응답을 입력 칸 값으로 바꿉니다(숫자는 문자열로).
export function purchaseInfoForm(info) {
  if (!info) return emptyPurchaseInfo()
  return {
    storeName: info.storeName || '',
    productUrl: info.productUrl || '',
    productPrice: String(info.productPrice ?? ''),
    paybackAmount: String(info.paybackAmount ?? ''),
    purchaseGuide: info.purchaseGuide || '',
  }
}

const MAX_AMOUNT = 100_000_000
const wholeNumber = (value) => /^\d+$/.test(String(value ?? '').trim())

function isWebAddress(value) {
  try {
    const url = new URL(String(value).trim())
    return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.host
  } catch {
    return false
  }
}

// 업체가 입력한 구매 안내를 확인합니다. 문제가 없으면 빈 문자열입니다.
export function purchaseInfoError(info) {
  const value = info || {}
  if (!String(value.storeName || '').trim())
    return '구매처 이름을 입력해 주세요.'
  if (String(value.storeName).trim().length > 50)
    return '구매처 이름은 50자 이내로 입력해 주세요.'
  if (!isWebAddress(value.productUrl))
    return '상품 페이지 주소를 http(s)://로 시작하게 입력해 주세요.'
  if (
    !wholeNumber(value.productPrice) ||
    Number(value.productPrice) > MAX_AMOUNT
  )
    return '판매가를 숫자로 입력해 주세요.'
  if (
    !wholeNumber(value.paybackAmount) ||
    Number(value.paybackAmount) > MAX_AMOUNT
  )
    return '환급액을 숫자로 입력해 주세요.'
  if (Number(value.paybackAmount) > Number(value.productPrice))
    return '환급액은 판매가보다 클 수 없습니다.'
  if (String(value.purchaseGuide || '').length > 2000)
    return '구매 안내는 2,000자 이내로 입력해 주세요.'
  return ''
}

// 저장 요청 본문입니다.
export function purchaseInfoRequest(info) {
  return {
    storeName: info.storeName.trim(),
    productUrl: info.productUrl.trim(),
    productPrice: Number(info.productPrice),
    paybackAmount: Number(info.paybackAmount),
    purchaseGuide: info.purchaseGuide?.trim() || null,
  }
}

// 참여자가 내는 구매 인증을 확인합니다(주문번호·결제 금액·주문 내역 캡처 JPG/PNG 5MB).
export function purchaseProofError({ orderNumber, paidAmount, file } = {}) {
  const order = String(orderNumber || '').trim()
  if (!order) return '주문번호를 입력해 주세요.'
  if (order.length > 60) return '주문번호는 60자 이내로 입력해 주세요.'
  if (!wholeNumber(paidAmount) || Number(paidAmount) > MAX_AMOUNT)
    return '실제 결제한 금액을 숫자로 입력해 주세요.'
  if (!file) return '주문 내역 캡처를 첨부해 주세요.'
  if (!['image/jpeg', 'image/png'].includes(file.type))
    return '캡처는 JPG 또는 PNG 이미지로 올려 주세요.'
  if (file.size > 5 * 1024 * 1024)
    return '캡처 이미지는 5MB 이하만 올릴 수 있습니다.'
  return ''
}

// 업체 화면의 환급 기록 버튼을 보여줄지입니다. 구매평 검토가 끝나 완료되고, 아직 환급 전일 때만입니다.
// 업체 화면의 환급 상태 이름입니다. 구매평이 승인돼 완료됐고 아직 보내지 않았으면 환급 목록과 같이 '환급 가능'으로 보여 줍니다.
export function sellerPaybackLabel(application, proof) {
  if (canRecordPayback(application, proof)) return '환급 가능'
  return PAYBACK_LABELS[proof?.paybackStatus] || ''
}

export function canRecordPayback(application, proof) {
  return (
    application?.status === 'COMPLETED' &&
    !!proof &&
    proof.paybackStatus !== 'PAID'
  )
}
