// 채널 직접 등록 입력 검사, 연결 상태 배지, 운영자 목록 필터를 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  connectionBadge,
  manualFormError,
} from '../src/features/membership/channelConnectModel.js'
import {
  filterChannelReviews,
  rejectReasonError,
} from '../src/features/admin/channelVerificationModel.js'
import { notificationPath } from '../src/features/business/notificationModel.js'

const png = { type: 'image/png', size: 1000 }

test('직접 등록 입력: 주소·수치·캡처를 확인합니다', () => {
  const ok = {
    profileUrl: 'https://instagram.com/a',
    followerCount: '120',
    file: png,
  }
  assert.equal(manualFormError('instagram', ok), '')
  assert.match(
    manualFormError('instagram', { ...ok, followerCount: '' }),
    /팔로워 수/,
  )
  assert.match(manualFormError('instagram', { ...ok, file: null }), /캡처/)
  assert.match(
    manualFormError('instagram', {
      ...ok,
      file: { type: 'image/gif', size: 1 },
    }),
    /JPG 또는 PNG/,
  )
  // 네이버 블로그 이웃 수는 선택입니다.
  assert.equal(
    manualFormError('naver-blog', {
      profileUrl: 'https://blog.naver.com/a',
      followerCount: '',
      file: png,
    }),
    '',
  )
})

test('연결 상태 배지 문구', () => {
  assert.deepEqual(
    connectionBadge({ method: 'OAUTH', verificationStatus: 'VERIFIED' }),
    {
      text: '로그인 연결 · 확인됨',
      tone: 'is-ok',
    },
  )
  assert.equal(
    connectionBadge({ method: 'MANUAL', verificationStatus: 'PENDING' }).text,
    '직접 등록 · 확인 대기',
  )
  assert.equal(connectionBadge(null), null)
})

test('운영자 목록 필터와 반려 사유 검사', () => {
  const items = [
    {
      verificationStatus: 'PENDING',
      memberNickname: '하나',
      accountName: '@one',
    },
    {
      verificationStatus: 'VERIFIED',
      memberNickname: '둘',
      accountName: '@two',
    },
  ]
  assert.equal(filterChannelReviews(items, 'PENDING', '').length, 1)
  assert.equal(filterChannelReviews(items, '', '@TWO').length, 1)
  assert.match(rejectReasonError('  '), /사유/)
  assert.equal(rejectReasonError('캡처가 다릅니다'), '')
})

test('채널 확인 알림은 설정의 채널 연결로 이동합니다', () => {
  assert.equal(
    notificationPath({ targetType: 'MEMBER_CHANNEL_CONNECTION', targetId: 3 }),
    '/settings#channel-connect',
  )
})
