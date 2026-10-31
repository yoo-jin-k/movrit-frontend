import test from 'node:test'
import assert from 'node:assert/strict'
import {
  countEntries,
  dateTime,
  filterRows,
  money,
  statusLabel,
  statusTone,
} from '../src/features/admin/adminConsoleModel.js'

test('상태 코드를 한국어 이름과 색으로 바꿉니다', () => {
  assert.equal(statusLabel('SUSPENDED'), '정지')
  assert.equal(statusLabel('UNKNOWN_CODE'), 'UNKNOWN_CODE')
  assert.equal(statusLabel(null), '-')
  assert.equal(statusTone('APPROVED'), 'success')
  assert.equal(statusTone('REFUNDED'), 'danger')
  assert.equal(statusTone('PENDING'), 'warning')
  assert.equal(statusTone('DRAFT'), 'neutral')
})

test('금액과 서버 시각을 한국 형식으로 표시합니다', () => {
  assert.equal(money(29000), '29,000원')
  assert.equal(money('1500.5', 'USD'), '1,500.5 USD')
  assert.equal(money(null), '-')
  assert.equal(dateTime('2026-10-31T14:05:33.123'), '2026.10.31 14:05')
  assert.equal(dateTime(undefined), '-')
})

test('검색어와 상태 칩으로 목록을 거릅니다', () => {
  const rows = [
    { id: 1, name: '김유진', email: 'a@x.com', status: 'ACTIVE' },
    { id: 2, name: '박민지', email: 'b@x.com', status: 'SUSPENDED' },
  ]
  const keys = ['name', 'email']
  assert.deepEqual(
    filterRows(rows, { search: 'B@X', searchKeys: keys }).map((r) => r.id),
    [2],
  )
  assert.deepEqual(
    filterRows(rows, { chip: 'ACTIVE', chipKey: 'status' }).map((r) => r.id),
    [1],
  )
  assert.deepEqual(
    filterRows(rows, {
      chip: 'x',
      chipKey: (r) => (r.id === 2 ? 'x' : 'y'),
    }).map((r) => r.id),
    [2],
  )
})

test('상태별 건수를 많은 순으로 정리합니다', () => {
  assert.deepEqual(countEntries({ ACTIVE: 2, SUSPENDED: 5 }), [
    { code: 'SUSPENDED', label: '정지', count: 5 },
    { code: 'ACTIVE', label: '정상', count: 2 },
  ])
})
