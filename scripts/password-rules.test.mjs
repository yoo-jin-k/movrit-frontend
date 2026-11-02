// 비밀번호 재설정 화면의 새 비밀번호 규칙을 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import { newPasswordError } from '../src/features/auth/passwordRules.js'

test('새 비밀번호 규칙: 길이·영문·숫자·확인 일치', () => {
  assert.match(newPasswordError('abc12', 'abc12'), /8자/)
  assert.match(newPasswordError('abcdefgh', 'abcdefgh'), /영문자와 숫자/)
  assert.match(newPasswordError('abcd1234', 'abcd1235'), /일치/)
  assert.equal(newPasswordError('abcd1234', 'abcd1234'), '')
})
