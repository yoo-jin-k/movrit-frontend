// 캠페인 상세 방문 장소의 지도 검색 링크와 복사용 주소를 확인합니다.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  visitAddressText,
  visitMapLinks,
} from '../src/features/discovery/visitMapModel.js'

test('도로명 주소로 카카오맵·네이버 지도 검색 링크를 만듭니다', () => {
  const links = visitMapLinks({
    address1: '서울 성동구 성수이로 1',
    address2: '2층 201호',
  })
  assert.deepEqual(
    links.map((link) => link.href),
    [
      `https://map.kakao.com/link/search/${encodeURIComponent('서울 성동구 성수이로 1')}`,
      `https://map.naver.com/p/search/${encodeURIComponent('서울 성동구 성수이로 1')}`,
    ],
  )
  assert.deepEqual(
    links.map((link) => link.label),
    ['카카오맵', '네이버 지도'],
  )
})

test('특수 문자가 들어간 주소도 주소 경로를 깨지 않게 바꿉니다', () => {
  const [kakao] = visitMapLinks({ address1: ' 부산 해운대구 A/B #3 ' })
  assert.equal(
    kakao.href,
    'https://map.kakao.com/link/search/%EB%B6%80%EC%82%B0%20%ED%95%B4%EC%9A%B4%EB%8C%80%EA%B5%AC%20A%2FB%20%233',
  )
})

test('주소가 없으면 링크를 만들지 않습니다', () => {
  assert.deepEqual(visitMapLinks(null), [])
  assert.deepEqual(visitMapLinks({ address1: '   ' }), [])
})

test('복사용 주소는 도로명 주소와 상세 주소를 한 줄로 합칩니다', () => {
  assert.equal(
    visitAddressText({ address1: '서울 성동구 성수이로 1', address2: '2층' }),
    '서울 성동구 성수이로 1 2층',
  )
  assert.equal(visitAddressText({ address1: '서울', address2: '  ' }), '서울')
  assert.equal(visitAddressText(undefined), '')
})
