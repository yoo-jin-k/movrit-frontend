import test from 'node:test'
import assert from 'node:assert/strict'
import {
  adaptOrderSummary,
  filterOrders,
  ORDER_FILTERS,
} from '../src/features/orders/orderModel.js'

test('주문 표시에는 최신 응답 필드를 우선하고 기존 필드는 대체값으로 사용합니다', () => {
  const order = {
    id: 7,
    orderNumber: 'NEW-7',
    number: 'OLD-7',
    preorderTitle: '새 주문명',
    title: '기존 주문명',
    status: 'PREPARING',
    createdAt: '2026-11-16T12:30:00',
    date: '2026-11-15',
    totalPaymentAmount: 12000,
    amount: '기존 금액',
  }

  assert.deepEqual(adaptOrderSummary(order), {
    id: 7,
    number: 'NEW-7',
    title: '새 주문명',
    status: '결제완료',
    date: '2026-11-16',
    amount: `${Number(12000).toLocaleString()}원`,
  })
  assert.equal(order.status, 'PREPARING')
})

test('누락 필드·숫자 0·문자열 금액·알 수 없는 상태의 기존 표시 규칙을 유지합니다', () => {
  const legacy = {
    number: 'OLD-1',
    title: '기존 주문',
    date: '2026-11-15',
    amount: '기존 금액',
    status: 'UNKNOWN',
    totalPaymentAmount: 0,
  }
  const result = adaptOrderSummary(legacy)
  assert.equal(result.number, legacy.number)
  assert.equal(result.title, legacy.title)
  assert.equal(result.date, legacy.date)
  assert.equal(result.status, 'UNKNOWN')
  assert.equal(result.amount, '기존 금액')
  assert.equal(
    adaptOrderSummary({ ...legacy, totalPaymentAmount: '0' }).amount,
    '0원',
  )
  assert.equal(adaptOrderSummary({}).amount, undefined)
})

test('결제·취소 상태를 탭별로 묶고 주문 순서와 원본 목록을 보존합니다', () => {
  const orders = ['PAID', 'CANCELLED', 'PREPARING', 'REFUNDED', 'SHIPPED'].map(
    (status, id) => adaptOrderSummary({ id, status }),
  )
  assert.deepEqual(
    filterOrders(orders, '결제완료').map((order) => order.id),
    [0, 2],
  )
  assert.deepEqual(
    filterOrders(orders, '취소').map((order) => order.id),
    [1, 3],
  )
  assert.strictEqual(filterOrders(orders, '전체'), orders)
  assert.deepEqual(filterOrders([], '배송중'), [])
  assert.equal(orders.length, 5)
  assert.deepEqual(ORDER_FILTERS, [
    '전체',
    '진행중',
    '결제완료',
    '배송중',
    '완료',
    '취소',
  ])
})
