import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateEligibility,
  applicationAvailable,
  eligibilityReason,
} from '../src/features/discovery/eligibilityModel.js'
const form = { campaignId: 9, version: 1 }
const ready = {
  campaignId: 9,
  formVersion: 1,
  applicationEligibilityPolicy: 'EMAIL_TEMPORARY',
  emailVerified: true,
  identityVerified: false,
  channelReady: true,
  alreadyApplied: false,
  canApply: true,
  blockingReasons: [],
}
test('서버가 허용한 이메일 확인 사용자는 실명 미확인과 분리해 신청할 수 있습니다', () => {
  assert.equal(
    applicationAvailable(validateEligibility(ready, '9'), form),
    true,
  )
  assert.equal(ready.identityVerified, false)
})
test('미인증·중복·서버 거절·미지의 차단 사유는 신청 폼을 열지 않습니다', () => {
  for (const override of [
    { emailVerified: false },
    { alreadyApplied: true },
    { canApply: false },
    { channelReady: false },
    { blockingReasons: ['UNKNOWN_REASON'] },
  ]) {
    assert.equal(applicationAvailable({ ...ready, ...override }, form), false)
  }
  assert.match(eligibilityReason('ALREADY_APPLIED'), /이미 신청/)
  assert.match(eligibilityReason('UNKNOWN_REASON'), /신청할 수 없는 조건/)
})
test('폼이 없거나 서버 조건 버전·캠페인이 바뀌면 재확인이 필요합니다', () => {
  assert.equal(applicationAvailable(ready, null), false)
  assert.equal(applicationAvailable(ready, { ...form, version: 2 }), false)
  assert.equal(applicationAvailable(ready, { ...form, campaignId: 10 }), false)
})
test('누락되거나 잘못된 서버 상태를 신청 허용으로 해석하지 않습니다', () => {
  assert.throws(() => validateEligibility({}, 9))
  assert.throws(() => validateEligibility({ ...ready, campaignId: 10 }, 9))
  assert.throws(() => validateEligibility({ ...ready, canApply: 'true' }, 9))
  assert.throws(() =>
    validateEligibility({ ...ready, blockingReasons: null }, 9),
  )
})
