/**
 * 배송 관리 화면 규칙입니다(서버와 같은 기준으로 먼저 안내합니다).
 */

// 송장번호는 영문·숫자·하이픈 6~30자입니다. 빈 값은 '아직 입력 안 함'으로 봅니다.
export function trackingError(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (!/^[0-9A-Za-z-]{6,30}$/.test(text))
    return '송장번호는 영문·숫자·하이픈 6~30자로 입력해 주세요.'
  return ''
}

// 배송 단계 이름입니다.
export function shippingStage(row) {
  if (row?.receivedAt) return { code: 'RECEIVED', label: '수령 확인' }
  if (row?.trackingNumber) return { code: 'SHIPPED', label: '발송' }
  return { code: 'READY', label: '발송 전' }
}

// 단계별 인원입니다.
export function shippingSummary(rows) {
  const counts = { READY: 0, SHIPPED: 0, RECEIVED: 0 }
  for (const row of rows || []) counts[shippingStage(row).code] += 1
  return counts
}

// 화면에서 고친 송장 중 저장할 것만 고릅니다(택배사·송장번호가 모두 있고 처음 값과 다른 줄).
// edits는 { [applicationId]: { courier, trackingNumber } }입니다.
export function changedShipments(rows, edits) {
  return (rows || [])
    .filter((row) => !row.receivedAt && edits?.[row.applicationId])
    .map((row) => ({
      applicationId: row.applicationId,
      courier: String(
        edits[row.applicationId].courier ?? row.courier ?? '',
      ).trim(),
      trackingNumber: String(
        edits[row.applicationId].trackingNumber ?? row.trackingNumber ?? '',
      ).trim(),
      before: `${row.courier || ''}|${row.trackingNumber || ''}`,
    }))
    .filter(
      (item) =>
        item.courier &&
        item.trackingNumber &&
        `${item.courier}|${item.trackingNumber}` !== item.before,
    )
    .map(({ applicationId, courier, trackingNumber }) => ({
      applicationId,
      courier,
      trackingNumber,
    }))
}

// 저장 결과 한 줄 안내입니다.
export function saveSummary(result) {
  const failures = (result?.results || []).filter((item) => !item.success)
  if (!failures.length)
    return `송장 ${result?.successCount ?? 0}건을 저장하고 참여자에게 알렸습니다.`
  return `송장 ${result?.successCount ?? 0}건 저장, ${failures.length}건은 저장하지 못했습니다(${[
    ...new Set(failures.map((item) => item.message)),
  ].join(' / ')}).`
}

// 서버 시각을 '11.03 14:20'처럼 보여줍니다.
export function shortTime(value) {
  const match = String(value || '').match(
    /^\d{4}-(\d{2})-(\d{2})T(\d{2}):(\d{2})/,
  )
  return match ? `${match[1]}.${match[2]} ${match[3]}:${match[4]}` : '-'
}
