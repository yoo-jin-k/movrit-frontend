import test from 'node:test'
import assert from 'node:assert/strict'
import {
  reviewPayload,
  safeContentUrl,
  dateLabel,
} from '../src/features/business/businessModel.js'
test('콘텐츠 검토는 조회한 버전을 보존하며 버전 0도 유효하다', () => {
  assert.deepEqual(
    reviewPayload({ version: 0 }, ' 확인했습니다. ', 'approve'),
    { comment: '확인했습니다.', expectedVersion: 0 },
  )
  assert.throws(() => reviewPayload({ version: null }, '', 'approve'))
  assert.throws(() => reviewPayload({}, '', 'approve'))
})
test('수정 요청은 공백 의견을 거부하고 길이 제한을 적용한다', () => {
  assert.throws(() => reviewPayload({ version: 2 }, '  ', 'request-revision'))
  assert.throws(() =>
    reviewPayload({ version: 2 }, '가'.repeat(2001), 'approve'),
  )
  assert.deepEqual(reviewPayload({ version: 2 }, '', 'approve'), {
    comment: null,
    expectedVersion: 2,
  })
})
test('제출 링크는 http/https만 허용한다', () => {
  assert.equal(safeContentUrl('javascript:alert(1)'), null)
  assert.equal(safeContentUrl('data:text/html,x'), null)
  assert.equal(safeContentUrl('/relative'), null)
  assert.equal(
    safeContentUrl('https://example.com/post'),
    'https://example.com/post',
  )
})
test('시간대 없는 API 일정은 한국 시간으로 표시한다', () => {
  assert.equal(
    dateLabel('2026-10-17T14:00:00'),
    dateLabel('2026-10-17T05:00:00Z'),
  )
  assert.equal(dateLabel(null), '일정 미제공')
})
