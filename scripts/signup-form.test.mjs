// 회원가입 휴대폰 번호 입력 규칙(숫자만 입력·하이픈 자동 표시·서버 전송 형식)을 확인합니다.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  signupPhoneError,
  signupPhoneInput,
  signupPhonePayload,
} from '../src/features/auth/signupFormModel.js'

// 서버 MemberSignupRequest.phone 규칙과 같은 식입니다.
const SERVER_PHONE = /^$|^[0-9+-]{8,20}$/

test('숫자만 입력하면 하이픈을 붙여 보여 주고, 숫자가 아닌 글자는 지웁니다', () => {
  assert.equal(signupPhoneInput('01012345678'), '010-1234-5678')
  assert.equal(signupPhoneInput('0111234567'), '011-123-4567')
  assert.equal(signupPhoneInput('010'), '010')
  assert.equal(signupPhoneInput('0101'), '010-1')
  assert.equal(signupPhoneInput('010 1234 5678'), '010-1234-5678')
  assert.equal(signupPhoneInput('010-1234-5678'), '010-1234-5678')
  assert.equal(signupPhoneInput('010abc1234ㄱ5678'), '010-1234-5678')
  assert.equal(signupPhoneInput('0101234567899'), '010-1234-5678')
  assert.equal(signupPhoneInput(''), '')
  assert.equal(signupPhoneInput(null), '')
})

test('휴대폰 번호는 선택 사항이며, 입력했다면 휴대폰 형식인지 확인합니다', () => {
  assert.equal(signupPhoneError(''), '')
  assert.equal(signupPhoneError('   '), '')
  assert.equal(signupPhoneError('010-1234-5678'), '')
  assert.equal(signupPhoneError('011-123-4567'), '')
  assert.match(signupPhoneError('010-12'), /확인해 주세요/)
  assert.match(signupPhoneError('02-123-4567'), /확인해 주세요/)
})

test('서버로 보내는 번호는 서버 가입 규칙에 맞습니다', () => {
  for (const input of ['', '01012345678', '010-1234-5678', '0111234567']) {
    const payload = signupPhonePayload(input)
    assert.match(payload, SERVER_PHONE, input)
  }
  assert.equal(signupPhonePayload('01012345678'), '010-1234-5678')
  assert.equal(signupPhonePayload(''), '')
})
