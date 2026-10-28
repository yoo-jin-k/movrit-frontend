import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeMemberNickname } from '../src/features/membership/memberNickname.js'

test('닉네임 앞뒤 공백과 연속 공백을 정규화합니다', () => {
  assert.equal(
    normalizeMemberNickname('  모브릿   사용자_1  '),
    '모브릿 사용자_1',
  )
})
test('허용 문자와 2~20자 경계를 검사합니다', () => {
  for (const value of [
    '',
    ' ',
    '가',
    'a'.repeat(21),
    '😃사용자',
    '사용자!',
    'カタカナ',
  ]) {
    assert.throws(() => normalizeMemberNickname(value))
  }
  assert.equal(normalizeMemberNickname('가나'), '가나')
  assert.equal(normalizeMemberNickname('a'.repeat(20)), 'a'.repeat(20))
})
