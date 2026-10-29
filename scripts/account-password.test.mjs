import test from 'node:test'
import assert from 'node:assert/strict'
import {
  passwordValidation,
  passwordError,
} from '../src/features/membership/accountPasswordModel.js'
test('비밀번호 확인과 재사용·UTF-8 바이트 한도를 검사합니다', () => {
  const base = {
    currentPassword: 'OldPassword123',
    newPassword: 'NewPassword123',
    confirm: 'NewPassword123',
  }
  assert.equal(passwordValidation(base), '')
  assert.match(passwordValidation({ ...base, confirm: 'other' }), /일치/)
  assert.match(
    passwordValidation({ ...base, currentPassword: base.newPassword }),
    /다른/,
  )
  assert.match(
    passwordValidation({ ...base, newPassword: 'a1' + '가'.repeat(24) }),
    /72바이트/,
  )
  assert.equal(
    passwordValidation({
      ...base,
      newPassword: 'a'.repeat(71) + '1',
      confirm: 'a'.repeat(71) + '1',
    }),
    '',
  )
})
test('업무 오류를 로그인 만료와 구분합니다', () => {
  assert.equal(
    passwordError({
      response: { status: 400, data: { detail: 'CURRENT_PASSWORD_MISMATCH' } },
    }),
    '현재 비밀번호가 올바르지 않습니다.',
  )
  assert.match(passwordError({ response: { status: 401 } }), /다시 로그인/)
  assert.match(
    passwordError({
      response: { status: 409, data: { detail: 'PASSWORD_NOT_CONFIGURED' } },
    }),
    /소셜 로그인/,
  )
  assert.match(passwordError({}), /결과를 확인하지 못/)
})
