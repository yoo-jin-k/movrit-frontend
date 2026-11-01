// 모집이 끝난 캠페인이 '모집 종료'로 표시되고 신청 버튼이 닫히는지 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isRecruiting,
  recruitmentDeadlineLabel,
} from '../src/features/discovery/campaignDates.js'

const now = new Date('2026-11-02T01:30:00+09:00')

test('공개 상태여도 같은 날 종료 시각이 지나면 모집 종료로 봅니다', () => {
  const detail = { open: true, endAt: '2026-11-02T01:10:00' }
  assert.equal(isRecruiting(detail, now), false)
  assert.equal(recruitmentDeadlineLabel(detail, now), '모집 종료')
})

test('종료 시각 전이면 모집 중입니다', () => {
  const detail = { open: true, endAt: '2026-11-02T23:00:00' }
  assert.equal(isRecruiting(detail, now), true)
  assert.equal(recruitmentDeadlineLabel(detail, now), '오늘 마감')
})

test('업체가 직접 마감한 캠페인은 모집 종료입니다', () => {
  assert.equal(
    isRecruiting({ open: false, endAt: '2026-11-20T00:00:00' }, now),
    false,
  )
})
