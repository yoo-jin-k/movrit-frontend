// 휴대폰 인증 화면 규칙(번호 형식·인증번호 형식·입력 모양·남은 시간)을 확인합니다.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  codeError,
  formatPhoneInput,
  phoneDigits,
  phoneError,
  remainingText,
} from '../src/features/membership/phoneVerificationModel.js'

test('휴대폰 번호는 국내 휴대폰 형식만 받고 하이픈·공백은 무시합니다', () => {
  assert.equal(phoneError(''), '휴대폰 번호를 입력해 주세요.')
  assert.equal(phoneError('010-1234-5678'), '')
  assert.equal(phoneError('011 123 4567'), '')
  assert.match(phoneError('02-123-4567'), /확인해 주세요/)
  assert.match(phoneError('010-12-34'), /확인해 주세요/)
  assert.equal(phoneDigits('010-1234 5678'), '01012345678')
})

test('인증번호는 6자리 숫자이고, 번호 입력은 하이픈을 붙여 보여 줍니다', () => {
  assert.equal(codeError('123456'), '')
  assert.match(codeError('12345'), /6자리/)
  assert.match(codeError('12a456'), /6자리/)
  assert.equal(formatPhoneInput('01012345678'), '010-1234-5678')
  assert.equal(formatPhoneInput('0111234567'), '011-123-4567')
  assert.equal(formatPhoneInput('010-12'), '010-12')
  assert.equal(formatPhoneInput('010123456789999'), '010-1234-5678')
  assert.equal(remainingText(245), '4:05')
  assert.equal(remainingText(-3), '0:00')
})
