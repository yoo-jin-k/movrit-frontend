// 캠페인 상세 방문 장소 지도의 스크립트 주소와 좌표 해석을 확인합니다.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  geocodePoint,
  naverMapScriptUrl,
} from '../src/features/discovery/visitMapModel.js'

test('네이버 지도 스크립트 주소는 ncpKeyId와 geocoder를 쓰고, 키가 없으면 비웁니다', () => {
  assert.equal(
    naverMapScriptUrl(' abc123 '),
    'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=abc123&submodules=geocoder',
  )
  assert.equal(naverMapScriptUrl(''), '')
  assert.equal(naverMapScriptUrl(undefined), '')
})

test('주소 검색 결과의 첫 좌표를 위도·경도 숫자로 꺼내고, 없으면 null입니다', () => {
  assert.deepEqual(
    geocodePoint({
      v2: {
        addresses: [
          { x: '127.0557', y: '37.5446' },
          { x: '1', y: '2' },
        ],
      },
    }),
    { lat: 37.5446, lng: 127.0557 },
  )
  assert.equal(geocodePoint({ v2: { addresses: [] } }), null)
  assert.equal(geocodePoint({ v2: { addresses: [{ x: '', y: 'abc' }] } }), null)
  assert.equal(geocodePoint(undefined), null)
})
