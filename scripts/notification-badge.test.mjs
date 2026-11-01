// 미확인 알림 배지 문구와 선정 후 취소 안내 규칙을 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { unreadBadgeText } from '../src/features/notifications/notificationBadge.js'
import { needsBrandForCancellation } from '../src/features/membership/campaignCancellationModel.js'

test('미확인 알림이 없으면 배지를 그리지 않고 99개를 넘으면 99+로 줄입니다', () => {
  assert.equal(unreadBadgeText(0), '')
  assert.equal(unreadBadgeText(undefined), '')
  assert.equal(unreadBadgeText(3), '3')
  assert.equal(unreadBadgeText(120), '99+')
})

test('선정·참여 중에는 업체 문의 안내를 보여줍니다', () => {
  assert.equal(needsBrandForCancellation({ status: 'SELECTED' }), true)
  assert.equal(needsBrandForCancellation({ status: 'ACTIVE' }), true)
  assert.equal(needsBrandForCancellation({ status: 'SUBMITTED' }), false)
  assert.equal(
    needsBrandForCancellation({ status: 'CONTENT_SUBMITTED' }),
    false,
  )
})
