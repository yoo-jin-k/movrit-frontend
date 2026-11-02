// 홈 화면 계산(homeModel.js) 단위 테스트입니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  categoryItems,
  closingItems,
  experienceCounts,
  featuredPages,
  highChanceItems,
  recruitingItems,
  weekLabel,
} from '../src/features/discovery/homeModel.js'

const item = (id, extra = {}) => ({
  id,
  daysLeft: 5,
  recruitmentEnded: false,
  applicants: 1,
  capacity: 5,
  ...extra,
})

test('이번 주 표시는 한국 날짜 기준으로 몇째 주인지 셉니다', () => {
  // 2026-11-01은 일요일이라 1~7일이 첫째 주입니다.
  assert.equal(weekLabel(new Date('2026-11-03T03:00:00+09:00')), '11월 첫째 주')
  assert.equal(weekLabel(new Date('2026-11-08T10:00:00+09:00')), '11월 둘째 주')
  // UTC로는 10월 31일이지만 한국은 11월 1일입니다.
  assert.equal(weekLabel(new Date('2026-10-31T16:00:00Z')), '11월 첫째 주')
})

test('모집이 끝난 캠페인은 모집 중 목록에서 빠집니다', () => {
  const list = [
    item('a'),
    item('b', { recruitmentEnded: true }),
    item('c', { daysLeft: -1 }),
    item('d', { daysLeft: null }),
  ]
  assert.deepEqual(
    recruitingItems(list).map((x) => x.id),
    ['a', 'd'],
  )
})

test('마감이 가까운 순서이며 마감일을 모르면 뺍니다', () => {
  const list = [
    item('a', { daysLeft: 9 }),
    item('b', { daysLeft: 0 }),
    item('c', { daysLeft: null }),
    item('d', { daysLeft: 3 }),
  ]
  assert.deepEqual(
    closingItems(list).map((x) => x.id),
    ['b', 'd', 'a'],
  )
})

test('선정 확률은 경쟁률이 낮은 순이고, 실제 모드에서는 미리보기 항목을 섞지 않습니다', () => {
  const list = [
    item('a', { applicants: 10, capacity: 5 }),
    item('b', { applicants: 1, capacity: 5 }),
    item('c', { applicants: null }),
    item('p', { applicants: 0, capacity: 5, preview: true }),
  ]
  assert.deepEqual(
    highChanceItems(list, false).map((x) => x.id),
    ['b', 'a'],
  )
  assert.deepEqual(
    highChanceItems(list, true).map((x) => x.id),
    ['p', 'b', 'a'],
  )
})

test('카테고리 버튼은 전체면 거르지 않습니다', () => {
  const list = [
    item('a', { category: '뷰티' }),
    item('b', { category: '식품' }),
  ]
  assert.equal(categoryItems(list, '전체').length, 2)
  assert.deepEqual(
    categoryItems(list, '식품').map((x) => x.id),
    ['b'],
  )
})

test('많이 신청한 캠페인을 2개씩 최대 3화면으로 나눕니다', () => {
  const list = Array.from({ length: 8 }, (_, i) =>
    item(String(i), { applicants: i }),
  )
  const pages = featuredPages(list)
  assert.equal(pages.length, 3)
  assert.deepEqual(
    pages[0].map((x) => x.id),
    ['7', '6'],
  )
})

test('체험 방식별 모집 수를 셉니다', () => {
  const list = [
    item('a', { kind: '제품' }),
    item('b', { kind: '구매평', shoppingreview: true }),
    item('c', { kind: '지역' }),
    item('d', { kind: '제품', media: '클립' }),
    item('e', { kind: '지역', recruitmentEnded: true }),
  ]
  assert.deepEqual(experienceCounts(list), {
    delivery: 2,
    visit: 1,
    purchase: 1,
    shortform: 1,
  })
})
