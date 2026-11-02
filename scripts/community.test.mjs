// 커뮤니티 게시판 규칙(서버 글 번호·입력 검사·날짜)을 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isServerPostId,
  postDate,
  postFormError,
} from '../src/features/discovery/communityModel.js'

test('서버 글 번호와 안내 글 이름을 구분합니다', () => {
  assert.equal(isServerPostId('12'), true)
  assert.equal(isServerPostId('guide'), false)
  assert.equal(isServerPostId('write'), false)
})

test('글 입력 검사', () => {
  assert.match(postFormError({ title: 'a', body: '본문입니다요' }), /제목/)
  assert.match(postFormError({ title: '제목입니다', body: '짧' }), /내용/)
  assert.equal(
    postFormError({ title: '제목입니다', body: '충분한 본문입니다.' }),
    '',
  )
})

test('날짜 표시', () => {
  assert.equal(postDate('2026-11-02T10:00:00'), '2026.11.02')
  assert.equal(postDate(null), '')
})
