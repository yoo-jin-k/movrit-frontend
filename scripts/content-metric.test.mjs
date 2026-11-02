// 콘텐츠 성과 화면 규칙(숫자 표시, 입력 확인, 지난 기록과의 차이)을 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  compactCount,
  engagementRate,
  growth,
  metricPayload,
  signed,
  todayIso,
} from '../src/features/contentMetric/contentMetricModel.js'

const URL = 'https://www.instagram.com/p/abc/'

test('큰 숫자 짧게 보기', () => {
  assert.equal(compactCount(980), '980')
  assert.equal(compactCount(12400), '1.2만')
  assert.equal(compactCount(1_250_000), '125만')
  assert.equal(compactCount(320_000_000), '3.2억')
  assert.equal(compactCount(null), '0')
})

test('입력 확인: 콤마 허용, 빈칸·소수·음수·큰 값 거절', () => {
  const ok = metricPayload(
    URL,
    { viewCount: '1,200', likeCount: '35', commentCount: '0', measuredOn: '' },
    '2026-11-03',
    '2026-10-30',
  )
  assert.deepEqual(ok.body, {
    contentUrl: URL,
    viewCount: 1200,
    likeCount: 35,
    commentCount: 0,
    measuredOn: '2026-11-03',
  })
  const form = { viewCount: '1', likeCount: '1', commentCount: '1' }
  assert.match(
    metricPayload(URL, { ...form, viewCount: '' }, '2026-11-03').error,
    /조회수 칸/,
  )
  assert.match(
    metricPayload(URL, { ...form, likeCount: '1.5' }, '2026-11-03').error,
    /좋아요 칸/,
  )
  assert.match(
    metricPayload(URL, { ...form, commentCount: '-1' }, '2026-11-03').error,
    /댓글 칸/,
  )
  assert.match(
    metricPayload(URL, { ...form, viewCount: '2000000000' }, '2026-11-03')
      .error,
    /너무 큽니다/,
  )
})

test('입력 확인: 날짜 범위', () => {
  const form = { viewCount: '1', likeCount: '1', commentCount: '1' }
  assert.match(
    metricPayload(URL, { ...form, measuredOn: '2026-11-04' }, '2026-11-03')
      .error,
    /오늘 이후/,
  )
  assert.match(
    metricPayload(
      URL,
      { ...form, measuredOn: '2026-10-29' },
      '2026-11-03',
      '2026-10-30',
    ).error,
    /2026-10-30/,
  )
})

test('지난 기록과의 차이와 참여율', () => {
  assert.equal(growth([{ measuredOn: '2026-11-03' }]), null)
  const diff = growth([
    {
      measuredOn: '2026-11-03',
      viewCount: 1500,
      likeCount: 40,
      commentCount: 5,
    },
    {
      measuredOn: '2026-10-31',
      viewCount: 1200,
      likeCount: 42,
      commentCount: 5,
    },
  ])
  assert.deepEqual(diff, {
    days: 3,
    viewCount: 300,
    likeCount: -2,
    commentCount: 0,
  })
  assert.equal(signed(300), '+300')
  assert.equal(signed(-2), '-2')
  assert.equal(
    engagementRate({ viewCount: 1000, likeCount: 45, commentCount: 5 }),
    '5%',
  )
  assert.equal(
    engagementRate({ viewCount: 0, likeCount: 1, commentCount: 0 }),
    '-',
  )
  assert.equal(todayIso(new Date(2026, 10, 3)), '2026-11-03')
})
