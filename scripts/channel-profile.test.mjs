import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  instagramMetricRequest,
  validateChannelProfile,
  metricTitle,
  metricVerificationLabel,
} from '../src/features/membership/channelProfileModel.js'
import {
  SIGNUP_OPTIONS,
  signupDestination,
} from '../src/features/membership/signupOptions.js'
test('빈 값이나 잘못된 수치를 0으로 보내지 않습니다', () => {
  for (const value of [
    '',
    ' ',
    null,
    undefined,
    '-1',
    '1.5',
    '1e3',
    '9007199254740992',
  ])
    assert.throws(() => instagramMetricRequest(value))
  assert.equal(instagramMetricRequest('0').value, 0)
  assert.deepEqual(instagramMetricRequest('500'), {
    channelType: 'INSTAGRAM',
    metricType: 'FOLLOWER_COUNT',
    value: 500,
    measurementPeriod: null,
    measuredAt: null,
  })
})
test('프로필 없음은 빈 목록으로 유지하고 확인 상태를 임의로 바꾸지 않습니다', () => {
  assert.deepEqual(
    validateChannelProfile({ profileExists: false, metrics: [] }),
    { profileExists: false, metrics: [] },
  )
  for (const verificationStatus of ['UNVERIFIED', 'VERIFIED', 'REJECTED']) {
    const metric = {
      id: 1,
      channelType: 'INSTAGRAM',
      metricType: 'FOLLOWER_COUNT',
      value: 500,
      verificationStatus,
    }
    assert.equal(
      validateChannelProfile({ profileExists: true, metrics: [metric] })
        .metrics[0].verificationStatus,
      verificationStatus,
    )
  }
  assert.throws(() =>
    validateChannelProfile({ profileExists: true, metrics: [{ value: null }] }),
  )
  assert.equal(metricVerificationLabel('UNVERIFIED'), '미확인')
})
test('업체 선택은 신청 화면 안내이며 권한 값으로 사용하지 않습니다', () => {
  assert.deepEqual(
    SIGNUP_OPTIONS.map((v) => v.id),
    ['USER', 'SELLER'],
  )
  assert.equal(signupDestination('SELLER'), '/seller/apply')
  assert.equal(signupDestination('ADMIN'), '/home')
})

test('채널 지표 제목은 서버 코드를 화면 이름으로 바꾸고 모르는 코드는 그대로 둡니다', () => {
  assert.equal(
    metricTitle({ channelType: 'INSTAGRAM', metricType: 'FOLLOWER_COUNT' }),
    '인스타그램 · 팔로워 수',
  )
  assert.equal(
    metricTitle({ channelType: 'BLOG', metricType: 'FOLLOWER_COUNT' }),
    '블로그 · 팔로워 수',
  )
  assert.equal(
    metricTitle({ channelType: 'TIKTOK', metricType: 'VIEW_COUNT' }),
    'TIKTOK · VIEW_COUNT',
  )
})
