import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loginError } from '../src/features/auth/loginError.js'
test('접근차단과 통신실패를 비밀번호 오류로 표시하지 않습니다', () => {
  for (const error of [
    { response: { status: 403 } },
    new Error('Network Error'),
    { response: { status: 502 } },
  ])
    assert.doesNotMatch(loginError(error), /비밀번호/)
  assert.match(
    loginError({ response: { status: 403 } }),
    /접속 주소 또는 접근 권한/,
  )
})
test('인증 실패와 요청 제한 안내를 구분합니다', () => {
  assert.match(
    loginError({ response: { status: 401 } }),
    /이메일 또는 비밀번호/,
  )
  assert.match(loginError({ response: { status: 429 } }), /요청이 많습니다/)
})
