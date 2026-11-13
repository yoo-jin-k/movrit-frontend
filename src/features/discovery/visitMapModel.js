/**
 * 방문 장소 주소로 지도 검색 링크와 복사용 주소를 만듭니다(지도 API 키 없이 쓰는 방법).
 * 카카오맵·네이버 지도의 공개 검색 주소를 새 창으로 엽니다. 우편번호는 검색어에서 뺍니다.
 */

// 도로명 주소와 상세 주소를 한 줄로 합칩니다. 공백만 있는 값은 뺍니다.
export function visitAddressText(location) {
  return [location?.address1, location?.address2]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(' ')
}

// 지도 검색은 도로명 주소(address1)로 합니다. 상세 주소(동·호수)는 검색 결과를 흐리게 하므로 넣지 않습니다.
// 주소가 없으면 빈 배열을 돌려줘 링크를 그리지 않습니다.
export function visitMapLinks(location) {
  const query = String(location?.address1 ?? '').trim()
  if (!query) return []
  const encoded = encodeURIComponent(query)
  return [
    {
      key: 'kakao',
      label: '카카오맵',
      href: `https://map.kakao.com/link/search/${encoded}`,
    },
    {
      key: 'naver',
      label: '네이버 지도',
      href: `https://map.naver.com/p/search/${encoded}`,
    },
  ]
}
