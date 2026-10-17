// PM 승인 파일 경계의 빠른 클라이언트 검사입니다. 실제 형식·픽셀·소유권 판정은 서버가 수행합니다.
export const CAMPAIGN_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const CAMPAIGN_DETAIL_IMAGE_LIMIT = 5
export function validateCampaignImageFile(file) {
  if (!file || !Number.isSafeInteger(file.size) || file.size <= 0)
    throw new Error('비어 있지 않은 이미지 파일을 선택해 주세요.')
  if (file.size > CAMPAIGN_IMAGE_MAX_BYTES)
    throw new Error('이미지는 파일당 5MiB 이하로 등록해 주세요.')
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('JPG, PNG 또는 WebP 이미지를 선택해 주세요.')
  return file
}
// 구조화된 공개 사업장 주소만 검증합니다. 기존 visitGuide에서 주소를 추측하지 않습니다.
export function validateVisitLocationInput(value) {
  const result = Object.fromEntries(
    ['venueName', 'postalCode', 'address1', 'address2'].map((key) => [
      key,
      String(value?.[key] ?? '').trim(),
    ]),
  )
  if (!result.venueName || !result.address1)
    throw new Error('공개 장소명과 기본 주소를 입력해 주세요.')
  if (
    result.venueName.length > 100 ||
    result.address1.length > 255 ||
    result.address2.length > 255
  )
    throw new Error('장소명은 100자, 주소는 각 255자 이내로 입력해 주세요.')
  if (result.postalCode && !/^\d{5}$/.test(result.postalCode))
    throw new Error('우편번호는 5자리 숫자로 입력해 주세요.')
  return result
}
