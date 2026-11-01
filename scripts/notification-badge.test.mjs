// 미확인 알림 배지 문구를 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { unreadBadgeText } from '../src/features/notifications/notificationBadge.js'

test('미확인 알림이 없으면 배지를 그리지 않고 99개를 넘으면 99+로 줄입니다', () => {
  assert.equal(unreadBadgeText(0), '')
  assert.equal(unreadBadgeText(undefined), '')
  assert.equal(unreadBadgeText(3), '3')
  assert.equal(unreadBadgeText(120), '99+')
})
