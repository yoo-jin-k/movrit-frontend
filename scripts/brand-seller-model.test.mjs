// 업체 브랜드 이미지 주소·브랜드 등록 안내·업체 신청 상태·운영 정보 조회 결과 판단을 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  brandImageError,
  brandImageSrc,
  brandSetupState,
} from '../src/features/business/brandModel.js'
import {
  businessEntry,
  sellerStatusLabel,
} from '../src/features/business/sellerEntryModel.js'
import { settleOperations } from '../src/features/business/sellerOperationsModel.js'

test('브랜드 이미지는 서버가 준 /uploads 상대 주소만 그대로 씁니다(포트 고정 없음)', () => {
  assert.equal(
    brandImageSrc('/uploads/brands/3/logo/a.png'),
    '/uploads/brands/3/logo/a.png',
  )
  assert.equal(brandImageSrc(null), null)
  assert.equal(brandImageSrc(''), null)
  assert.equal(brandImageSrc('javascript:alert(1)'), null)
  assert.equal(brandImageSrc('/uploads/../secret'), null)
  assert.equal(brandImageSrc('https://evil.example/a.png'), null)
})

test('브랜드 이미지 사전 검사는 서버와 같은 형식·5MB 기준을 따릅니다', () => {
  assert.equal(brandImageError(null), '')
  assert.equal(brandImageError({ type: 'image/png', size: 1024 }), '')
  assert.match(
    brandImageError({ type: 'image/gif', size: 10 }),
    /JPG, PNG, WEBP/,
  )
  assert.match(
    brandImageError({ type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 }),
    /5MB/,
  )
  assert.equal(
    brandImageError({ type: 'image/webp', size: 5 * 1024 * 1024 }),
    '',
  )
})

test('운영 중인 브랜드가 없을 때만 브랜드 등록 안내를 띄웁니다', () => {
  assert.equal(brandSetupState(null), null)
  assert.equal(brandSetupState([]), 'none')
  assert.equal(brandSetupState([{ status: 'INACTIVE' }]), 'inactive')
  assert.equal(
    brandSetupState([{ status: 'INACTIVE' }, { status: 'ACTIVE' }]),
    null,
  )
})

test('이용 서비스 선택 화면은 업체 상태에 맞는 버튼을 고릅니다', () => {
  assert.equal(businessEntry(null).primary.to, '/seller/apply')
  assert.equal(businessEntry(null, true).primary.to, '/seller/apply')
  const approved = businessEntry({ status: 'APPROVED', brandName: '루미' })
  assert.equal(approved.primary.to, '/seller/dashboard')
  assert.match(approved.summary, /루미/)
  assert.equal(businessEntry({ status: 'PENDING' }).primary.to, '/seller/apply')
  assert.equal(sellerStatusLabel('PENDING'), '심사 중')
  assert.equal(sellerStatusLabel('UNKNOWN'), '상태 확인 필요')
})

test('운영 정보는 실패한 영역만 따로 표시하고 404는 미제공 기능으로 구분합니다', () => {
  const notFound = { status: 'rejected', reason: { response: { status: 404 } } }
  const forbidden = {
    status: 'rejected',
    reason: { response: { status: 403 } },
  }
  const ok = (value) => ({ status: 'fulfilled', value })
  const result = settleOperations([
    ok([{ id: 1 }]),
    ok([]),
    forbidden,
    notFound,
  ])
  assert.equal(result.sections.orders.items.length, 1)
  assert.equal(result.sections.shipments.state, 'ready')
  assert.equal(result.sections.settlements.state, 'error')
  assert.equal(result.sections.reviews.state, 'unavailable')
  assert.deepEqual(result.failed, ['정산'])
  // 배열이 아닌 응답은 0건으로 꾸미지 않고 오류로 다룹니다.
  const malformed = settleOperations([ok({}), ok([]), ok([]), ok([])])
  assert.deepEqual(malformed.failed, ['판매 주문'])
})
