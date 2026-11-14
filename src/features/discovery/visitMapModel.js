/**
 * 캠페인 상세 방문 장소 지도(네이버 지도)에 쓰는 규칙입니다.
 * 스크립트 주소 만들기와 주소 검색 결과에서 좌표 꺼내기를 화면 코드와 분리해 테스트합니다.
 */

// 네이버 지도(NCP Maps) 스크립트 주소입니다. 키 이름은 새 콘솔 기준인 ncpKeyId를 쓰고,
// 주소를 좌표로 바꾸는 geocoder 하위 모듈을 함께 불러옵니다. 키가 비어 있으면 빈 문자열을 돌려줘 지도를 그리지 않습니다.
export function naverMapScriptUrl(keyId) {
  const key = String(keyId ?? '').trim()
  if (!key) return ''
  return `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(key)}&submodules=geocoder`
}

// geocoder 응답에서 첫 번째 주소의 좌표를 꺼냅니다. x는 경도, y는 위도이며 문자열로 옵니다.
// 결과가 없거나 숫자로 바꿀 수 없으면 null을 돌려줘 지도 대신 링크만 보이게 합니다.
export function geocodePoint(response) {
  const first = response?.v2?.addresses?.[0]
  const lng = Number(first?.x)
  const lat = Number(first?.y)
  if (!first || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}
