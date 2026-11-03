import test from 'node:test'
import assert from 'node:assert/strict'
import {
  notificationPath,
  filterNotifications,
} from '../src/features/business/notificationModel.js'
import { showsCancellationHelp } from '../src/features/membership/campaignCancellationModel.js'
test('알림 대상의 신청ID와 콘텐츠ID를 혼동하지 않고 화면별 경로를 구분합니다', () => {
  assert.equal(
    notificationPath({ targetType: 'CAMPAIGN_CONTENT', targetId: 12 }),
    '/mypage/campaigns?contentId=12',
  )
  assert.equal(
    notificationPath({ targetType: 'CAMPAIGN_CONTENT', targetId: 12 }, true),
    '/seller/contents?contentId=12',
  )
  assert.equal(
    notificationPath({ targetType: 'CAMPAIGN_APPLICATION', targetId: 4 }, true),
    '/seller/participants?applicationId=4',
  )
  for (const targetId of [null, 0, -1, '../../admin', 'bad'])
    assert.equal(
      notificationPath({ targetType: 'CAMPAIGN_APPLICATION', targetId }),
      null,
    )
  assert.equal(notificationPath({ targetType: 'UNKNOWN', targetId: 1 }), null)
})
test('읽지않음·캠페인·문의 필터는 실제 알림만 분류합니다', () => {
  const items = [
    { read: false, targetType: 'CAMPAIGN_CONTENT' },
    { read: true, targetType: 'CAMPAIGN_APPLICATION' },
    { read: false, targetType: 'INQUIRY' },
  ]
  assert.equal(filterNotifications(items, '').length, 3)
  assert.equal(filterNotifications(items, 'unread').length, 2)
  assert.equal(filterNotifications(items, 'campaign').length, 2)
  assert.equal(filterNotifications(items, 'INQUIRY').length, 1)
})
test('신청·진행 중에는 참여 조정(철회·취소) 안내를 보여줍니다', () => {
  for (const status of ['SUBMITTED', 'SELECTED', 'ACTIVE'])
    assert.equal(showsCancellationHelp({ status }), true)
  for (const status of [
    'REJECTED',
    'CANCELLED',
    'CONTENT_SUBMITTED',
    'COMPLETED',
    null,
  ])
    assert.equal(showsCancellationHelp({ status }), false)
})

import {
  canSelectApplication,
  selectionModeField,
} from '../src/features/business/selectionModeModel.js'
test('선정 주체와 접수 상태가 일치할 때만 명령을 엽니다', () => {
  assert.equal(
    canSelectApplication({ status: 'SUBMITTED' }, 'BRAND_DIRECT', 'brand'),
    true,
  )
  assert.equal(
    canSelectApplication({ status: 'SUBMITTED' }, 'OPERATOR', 'admin'),
    true,
  )
  for (const [mode, actor] of [
    ['OPERATOR', 'brand'],
    ['BRAND_DIRECT', 'admin'],
    [null, 'brand'],
    [null, 'admin'],
  ])
    assert.equal(
      canSelectApplication({ status: 'SUBMITTED' }, mode, actor),
      false,
    )
  assert.equal(
    canSelectApplication({ status: 'SELECTED' }, 'OPERATOR', 'admin'),
    false,
  )
  assert.deepEqual(selectionModeField({}, null), {
    selectionMode: 'BRAND_DIRECT',
  })
  assert.deepEqual(selectionModeField({}, {}), {})
  assert.deepEqual(selectionModeField({}, { selectionMode: 'OPERATOR' }), {
    selectionMode: 'OPERATOR',
  })
  assert.throws(() => selectionModeField({ selectionMode: 'UNKNOWN' }, null))
})
