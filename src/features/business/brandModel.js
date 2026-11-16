/**
 * 업체 브랜드 화면의 판단 규칙입니다(서버 호출 없음).
 * - 브랜드 이미지 주소: 서버가 돌려준 /uploads/... 상대 주소를 그대로 씁니다.
 *   화면과 같은 주소(개발: Vite 프록시, 배포: nginx)에서 백엔드로 넘어가므로 포트를 코드에 적지 않습니다.
 * - 이미지 파일 사전 검사: 서버(LocalFileStorageService)와 같은 JPG·PNG·WEBP, 5MB 이하 기준입니다.
 * - 브랜드 등록 안내: 운영 중인 브랜드가 없으면 업체 설정 상단에 등록 안내를 띄웁니다.
 *
 * 변경 이력(고치기 전 → 고친 후)
 * - 이미지 주소를 http://localhost:8080 + 경로로 만들어 시연 서버(18080)에서 이미지가 깨짐 → 상대 주소 사용.
 */
export const BRAND_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const BRAND_IMAGE_MAX_BYTES = 5 * 1024 * 1024

// 서버가 저장한 공개 이미지 주소만 표시합니다. 다른 형식(외부 주소·스크립트 주소 등)은 그리지 않습니다.
export function brandImageSrc(path) {
  if (typeof path !== 'string') return null
  const value = path.trim()
  return value.startsWith('/uploads/') && !value.includes('..') ? value : null
}

// 업로드 전에 형식·크기를 확인합니다. 문제가 없으면 빈 문자열을 돌려줍니다.
export function brandImageError(file) {
  if (!file) return ''
  if (!BRAND_IMAGE_TYPES.includes(file.type))
    return 'JPG, PNG, WEBP 이미지만 올릴 수 있습니다.'
  if (file.size > BRAND_IMAGE_MAX_BYTES)
    return '이미지는 5MB 이하만 올릴 수 있습니다.'
  return ''
}

/**
 * 업체 설정 상단 안내 상태입니다.
 * - 'none': 브랜드가 하나도 없음, 'inactive': 브랜드는 있지만 모두 비활성, null: 안내 불필요.
 * - 목록을 아직 못 읽었거나 읽기에 실패하면(null·배열 아님) 안내를 띄우지 않습니다.
 */
export function brandSetupState(brands) {
  if (!Array.isArray(brands)) return null
  if (brands.length === 0) return 'none'
  return brands.some((brand) => brand?.status === 'ACTIVE') ? null : 'inactive'
}
