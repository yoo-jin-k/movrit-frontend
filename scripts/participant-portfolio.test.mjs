import test from 'node:test'
import assert from 'node:assert/strict'
import {
  completedCountLabel,
  metricValueLabel,
  requirementResult,
  validateParticipantDetail,
} from '../src/features/business/participantPortfolioModel.js'
test('완료 0회와 누락된 집계, 지표 0과 미제공을 구분합니다', () => {
  assert.equal(completedCountLabel(0), '신규 참여자 · 완료 0회')
  assert.equal(completedCountLabel(null), '완료 횟수 확인 필요')
  assert.equal(metricValueLabel(0), '0')
  assert.equal(metricValueLabel(null), '미제공')
})
test('신청 당시 조건 없음과 유실, 집계 기간 불일치를 구분합니다', () => {
  assert.equal(
    requirementResult({
      evaluationBasis: 'NO_REQUIREMENT_AT_APPLICATION',
      applicationRequirementSnapshot: null,
    }),
    '추가 채널 조건 없음',
  )
  assert.equal(
    requirementResult({
      evaluationBasis: 'APPLICATION_SNAPSHOT_UNAVAILABLE',
      applicationRequirementSnapshot: null,
    }),
    '신청 당시 조건 확인 불가',
  )
  assert.equal(
    requirementResult({
      evaluationBasis: 'CURRENT_METRIC_AGAINST_APPLICATION_SNAPSHOT',
      applicationRequirementSnapshot: {},
      satisfied: false,
      reason: 'MEASUREMENT_PERIOD_MISMATCH',
    }),
    '지표 집계 기간 불일치',
  )
  assert.equal(
    requirementResult({ evaluationBasis: 'FUTURE', satisfied: true }),
    '조건 확인 필요',
  )
})
test('다른 신청 응답과 누락된 완료 집계를 정상 상세로 표시하지 않습니다', () => {
  const data = {
    applicationId: 7,
    profile: {},
    metrics: [],
    applicationAnswers: [],
    completedCampaignCount: 0,
    completedCampaigns: [],
    requirementEvaluation: { satisfied: true },
  }
  assert.equal(validateParticipantDetail(data, 7), data)
  assert.throws(() => validateParticipantDetail(data, 8))
  assert.throws(() =>
    validateParticipantDetail({ ...data, completedCampaignCount: null }, 7),
  )
  assert.throws(() =>
    validateParticipantDetail({ ...data, completedCampaigns: null }, 7),
  )
})
