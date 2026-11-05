import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateEligibility,
  applicationAvailable,
  eligibilityReason,
  campaignRequirementSummary,
  metricEvaluationSummary,
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
    { blockingReasons: ['UNKNOWN_REASON'] },
  ]) {
    assert.equal(applicationAvailable({ ...ready, ...override }, form), false)
  }
  assert.match(eligibilityReason('ALREADY_APPLIED'), /이미 신청/)
  assert.match(eligibilityReason('ALREADY_WITHDRAWN'), /철회한 캠페인/)
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

test('채널 조건이 없는 캠페인은 서버 허용 시 채널 미등록만으로 차단하지 않습니다', () => {
  assert.equal(
    applicationAvailable({ ...ready, channelReady: false }, form),
    true,
  )
})

test('지표 미등록, 미확인, 기준 미달을 구분하며 서버 차단을 유지합니다', () => {
  const codes = [
    'CHANNEL_METRIC_REQUIRED',
    'CHANNEL_METRIC_UNVERIFIED',
    'CHANNEL_METRIC_BELOW_MINIMUM',
  ]
  assert.equal(new Set(codes.map(eligibilityReason)).size, 3)
  for (const code of codes)
    assert.equal(
      applicationAvailable({ ...ready, blockingReasons: [code] }, form),
      false,
    )
})
test('명시적인 빈 조건만 조건 없음으로 표시하고 500을 캠페인 기준으로 표시합니다', () => {
  assert.match(campaignRequirementSummary(null), /조건이 없습니다/)
  for (const missing of [undefined, {}, [], { minimumValue: null }])
    assert.doesNotMatch(campaignRequirementSummary(missing), /조건이 없습니다/)
  assert.equal(
    campaignRequirementSummary({
      channelType: 'INSTAGRAM',
      metricType: 'FOLLOWER_COUNT',
      minimumValue: 500,
    }),
    '인스타그램 팔로워 수 500명 이상',
  )
})
test('이전 channelReady 없이도 신규 서버 응답을 검증합니다', () => {
  const { channelReady, ...current } = ready
  assert.equal(channelReady, true)
  assert.equal(
    applicationAvailable(
      validateEligibility(
        {
          ...current,
          channelProfileExists: false,
          campaignRequirement: null,
          metricEvaluation: null,
        },
        9,
      ),
      form,
    ),
    true,
  )
})

test('미등록 지표를 0이나 최하 등급으로 표시하지 않습니다', () => {
  assert.match(metricEvaluationSummary({ actualValue: null }), /미등록/)
  assert.doesNotMatch(metricEvaluationSummary({ actualValue: null }), /0/)
  assert.match(
    metricEvaluationSummary({
      actualValue: 0,
      verificationStatus: 'UNVERIFIED',
    }),
    /0 · 미확인/,
  )
})
