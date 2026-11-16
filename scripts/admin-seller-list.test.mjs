// 운영자 업체 목록의 정렬·검색·상태 건수와 왼쪽 메뉴 심사 대기 배지 문구를 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  pendingBadgeText,
  pendingCountFrom,
  sellerListPath,
  sellerRows,
  sellerSortValue,
  sellerStatusCounts,
  sortSellers,
  visibleSellers,
} from '../src/features/admin/adminSellerListModel.js'

const data = [
  {
    id: 1,
    businessName: '나무 상점',
    brandName: 'NAMU',
    representativeName: '이대표',
    businessNumber: '111-22-33333',
    status: 'APPROVED',
    createdAt: '2026-10-01T09:00:00',
  },
  {
    id: 2,
    businessName: '가람 공방',
    representativeName: '김대표',
    businessNumber: '222-33-44444',
    status: 'PENDING',
    createdAt: '2026-11-05T10:00:00',
  },
  {
    id: 3,
    businessName: '다온 스튜디오',
    status: 'PENDING',
    createdAt: '2026-11-05T10:00:00',
  },
]

test('응답이 배열이 아니면 행 대신 null을 돌려 오류로 다룹니다', () => {
  assert.equal(sellerRows({ content: [] }), null)
  assert.equal(sellerRows(null), null)
  const rows = sellerRows([{ id: 9 }, null, { name: 'id 없음' }])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].businessName, '-')
  assert.equal(rows[0].createdAt, '')
})

test('신청일 최신순이 기본이고 같은 시각이면 번호로 순서를 고정합니다', () => {
  const rows = sellerRows(data)
  assert.deepEqual(
    sortSellers(rows).map((r) => r.id),
    [3, 2, 1],
  )
  assert.deepEqual(
    sortSellers(rows, 'oldest').map((r) => r.id),
    [1, 2, 3],
  )
  assert.deepEqual(
    sortSellers(rows, 'name').map((r) => r.id),
    [2, 1, 3],
  )
  // 원본 배열은 바꾸지 않습니다.
  assert.deepEqual(
    rows.map((r) => r.id),
    [1, 2, 3],
  )
})

test('신청일이 없는 이전 응답도 정렬은 번호 순으로 이어집니다', () => {
  const rows = sellerRows([{ id: 5 }, { id: 7 }, { id: 6 }])
  assert.deepEqual(
    sortSellers(rows, 'newest').map((r) => r.id),
    [7, 6, 5],
  )
})

test('정렬 값은 정해진 목록 안에서만 주소에 넣습니다', () => {
  assert.equal(sellerSortValue('oldest'), 'oldest')
  assert.equal(sellerSortValue('createdAt;drop'), 'newest')
  assert.equal(sellerListPath('name'), '/admin/sellers?sort=name')
  assert.equal(sellerListPath(undefined), '/admin/sellers?sort=newest')
})

test('상태·검색어로 거르고 사업자번호는 숫자만으로도 찾습니다', () => {
  const rows = sellerRows(data)
  assert.deepEqual(
    visibleSellers(rows, { status: 'PENDING', sort: 'oldest' }).map(
      (r) => r.id,
    ),
    [2, 3],
  )
  assert.deepEqual(
    visibleSellers(rows, { search: 'namu' }).map((r) => r.id),
    [1],
  )
  assert.deepEqual(
    visibleSellers(rows, { search: '2223344' }).map((r) => r.id),
    [2],
  )
  assert.deepEqual(
    visibleSellers(rows, { search: '김대표' }).map((r) => r.id),
    [2],
  )
})

test('상태별 건수를 셉니다', () => {
  assert.deepEqual(sellerStatusCounts(sellerRows(data)), {
    '': 3,
    PENDING: 2,
    APPROVED: 1,
    REJECTED: 0,
  })
})

test('심사 대기 배지는 0건·알 수 없음이면 숨기고 99건을 넘으면 99+입니다', () => {
  assert.equal(pendingBadgeText(0), '')
  assert.equal(pendingBadgeText(null), '')
  assert.equal(pendingBadgeText(4), '4')
  assert.equal(pendingBadgeText(150), '99+')
  assert.equal(pendingCountFrom([{}, {}]), 2)
  assert.equal(pendingCountFrom({}), null)
})
