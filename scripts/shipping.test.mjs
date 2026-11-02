// 배송 관리 화면 규칙(송장 확인, 단계, 저장 대상 고르기)을 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  changedShipments,
  saveSummary,
  shippingStage,
  shippingSummary,
  trackingError,
} from '../src/features/shipping/shippingModel.js'

test('송장번호 형식', () => {
  assert.equal(trackingError(''), '')
  assert.equal(trackingError('123456789012'), '')
  assert.equal(trackingError('6898-1234-5678'), '')
  assert.match(trackingError('12345'), /6~30자/)
  assert.match(trackingError('1234 5678'), /6~30자/)
})

test('배송 단계와 인원', () => {
  const rows = [
    {},
    { trackingNumber: '123456' },
    { trackingNumber: '123456', receivedAt: '2026-11-03T10:00:00' },
  ]
  assert.deepEqual(
    rows.map((row) => shippingStage(row).label),
    ['발송 전', '발송', '수령 확인'],
  )
  assert.deepEqual(shippingSummary(rows), { READY: 1, SHIPPED: 1, RECEIVED: 1 })
})

test('바뀐 줄만 저장 대상, 수령 확인된 줄과 반쪽 입력은 제외', () => {
  const rows = [
    { applicationId: 1 },
    { applicationId: 2, courier: 'CJ대한통운', trackingNumber: '111111' },
    { applicationId: 3, receivedAt: 'x' },
    { applicationId: 4 },
  ]
  const edits = {
    1: { courier: 'CJ대한통운', trackingNumber: ' 222222 ' },
    2: { trackingNumber: '111111' },
    3: { courier: '한진택배', trackingNumber: '333333' },
    4: { trackingNumber: '444444' },
  }
  assert.deepEqual(changedShipments(rows, edits), [
    { applicationId: 1, courier: 'CJ대한통운', trackingNumber: '222222' },
  ])
  assert.match(
    saveSummary({ successCount: 1, results: [{ success: true }] }),
    /1건을 저장/,
  )
})
