// 캠페인 목록 조건 → 서버 검색 요청 변환과 페이지 번호 규칙을 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterPreviewCampaigns,
  pageNumbers,
  serverSearchParams,
} from '../src/features/discovery/campaignSearchModel.js'

test('검색 화면은 검색어·정렬·페이지만 보냅니다', () => {
  assert.deepEqual(
    serverSearchParams({
      search: true,
      query: ' 앰플 ',
      sort: 'closing',
      page: 2,
      category: '뷰티',
    }),
    { page: 1, size: 20, sort: 'closing', q: '앰플' },
  )
  assert.deepEqual(serverSearchParams({ search: true, query: '' }), {
    page: 0,
    size: 20,
  })
})

test('메뉴별 조건 변환', () => {
  assert.deepEqual(
    serverSearchParams({
      section: '제품',
      category: '뷰티',
      media: '인스타그램',
    }),
    {
      page: 0,
      size: 20,
      type: 'PRODUCT',
      category: '뷰티',
      channel: 'INSTAGRAM',
    },
  )
  assert.deepEqual(
    serverSearchParams({ section: '지역', category: '맛집', region: '서울' }),
    { page: 0, size: 20, type: 'LOCAL', category: '맛집', region: '서울' },
  )
  // 지역은 지역 메뉴에서만 보냅니다.
  assert.equal(
    serverSearchParams({ section: '제품', region: '서울' }).region,
    undefined,
  )
  assert.deepEqual(serverSearchParams({ section: '오늘오픈' }), {
    page: 0,
    size: 20,
    openedToday: true,
  })
  assert.deepEqual(
    serverSearchParams({
      section: '프리미어',
      category: '인스타그램 프리미어',
    }),
    { page: 0, size: 20, premier: true, channel: 'INSTAGRAM' },
  )
  assert.equal(
    serverSearchParams({ section: '프리미어', category: '네이버 인플루언서' })
      .channel,
    'BLOG',
  )
})

test('예시 데이터는 화면에서 같은 조건으로 거릅니다', () => {
  const items = [
    {
      title: '시카 앰플',
      kind: '제품',
      category: '뷰티',
      media: '인스타그램',
      applicants: 2,
      capacity: 10,
    },
    {
      title: '오월 그릴',
      kind: '지역',
      localCategory: '맛집',
      region: '서울',
      media: '블로그',
      applicants: 5,
      capacity: 2,
    },
  ]
  assert.equal(
    filterPreviewCampaigns(items, { search: true, query: '앰플' }).length,
    1,
  )
  assert.deepEqual(
    filterPreviewCampaigns(items, { section: '지역', region: '서울' }).map(
      (i) => i.title,
    ),
    ['오월 그릴'],
  )
})

test('페이지 번호는 많으면 줄여서 보여 줍니다', () => {
  assert.deepEqual(pageNumbers(1, 3), [1, 2, 3])
  assert.deepEqual(pageNumbers(6, 12), [1, '…', 4, 5, 6, 7, 8, '…', 12])
  assert.deepEqual(pageNumbers(1, 10), [1, 2, 3, '…', 10])
})
