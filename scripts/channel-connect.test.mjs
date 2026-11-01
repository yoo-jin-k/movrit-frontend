// SNS 채널 연결 화면의 표시 규칙을 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  channelErrorMessage,
  followerText,
  isChannelProvider,
} from '../src/features/membership/channelConnectModel.js'

test('알려진 서비스 이름만 콜백으로 받습니다', () => {
  assert.equal(isChannelProvider('instagram'), true)
  assert.equal(isChannelProvider('naver-blog'), true)
  assert.equal(isChannelProvider('facebook'), false)
  assert.equal(isChannelProvider(undefined), false)
})

test('팔로워·구독자 수 문구', () => {
  assert.equal(followerText('youtube', 12345), '구독자 12,345명')
  assert.equal(followerText('instagram', 980), '팔로워 980명')
  assert.equal(followerText('naver-blog', null), '이웃 수 미제공')
  assert.equal(followerText('youtube', null), '수치 비공개')
})

test('서버 안내 문구를 우선 보여줍니다', () => {
  assert.equal(
    channelErrorMessage(
      { response: { data: { detail: '준비 중입니다.' } } },
      '기본',
    ),
    '준비 중입니다.',
  )
  assert.equal(channelErrorMessage(new Error('x'), '기본'), '기본')
})
