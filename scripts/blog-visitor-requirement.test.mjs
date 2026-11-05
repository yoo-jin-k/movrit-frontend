// 네이버 블로그 일평균 방문자 조건의 저장 요청·안내 문구·업체 표시를 확인합니다.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  REQUIREMENT_KINDS,
  emptyRequirement,
  requirementKind,
  requirementPayload,
} from '../src/features/sellerCampaigns/requirementModel.js'
import {
  campaignRequirementSummary,
  eligibilityReason,
  isVisitorRequirement,
} from '../src/features/discovery/eligibilityModel.js'
import { requirementResult } from '../src/features/business/participantPortfolioModel.js'

const visitor = REQUIREMENT_KINDS.NAVER_BLOG_DAILY_VISITORS

test('블로그 방문자 조건은 최근 4일 평균 기간으로 저장합니다', () => {
  const payload = requirementPayload({
    ...emptyRequirement(),
    mode: 'CONDITION',
    channelType: visitor.channelType,
    metricType: visitor.metricType,
    measurementPeriod: visitor.measurementPeriod,
    minimumValue: '300',
  })
  assert.deepEqual(payload, {
    channelType: 'NAVER_BLOG',
    metricType: 'DAILY_VISITORS',
    minimumValue: 300,
    measurementPeriod: 'RECENT_4_DAYS',
  })
  // 기간이 다른 방문자 조건은 지원 조건으로 보지 않습니다.
  assert.equal(
    requirementKind({ ...payload, measurementPeriod: 'MONTHLY' }),
    null,
  )
  assert.equal(requirementKind(payload), 'NAVER_BLOG_DAILY_VISITORS')
})

test('방문자 조건 요약과 다시 확인 사유를 안내합니다', () => {
  const requirement = {
    channelType: 'NAVER_BLOG',
    metricType: 'DAILY_VISITORS',
    minimumValue: 1000,
    measurementPeriod: 'RECENT_4_DAYS',
  }
  assert.equal(
    campaignRequirementSummary(requirement),
    '네이버 블로그 일평균 방문자 1,000명 이상 (최근 4일 평균)',
  )
  assert.equal(isVisitorRequirement(requirement), true)
  assert.equal(
    isVisitorRequirement({
      channelType: 'INSTAGRAM',
      metricType: 'FOLLOWER_COUNT',
    }),
    false,
  )
  assert.match(eligibilityReason('CHANNEL_METRIC_STALE'), /하루가 지났습니다/)
})

test('업체 상세는 신청 당시 방문자 수로 판정 결과를 보여줍니다', () => {
  const snapshot = { channelType: 'NAVER_BLOG', metricType: 'DAILY_VISITORS' }
  assert.equal(
    requirementResult({
      evaluationBasis: 'METRIC_AT_APPLICATION',
      applicationRequirementSnapshot: snapshot,
      satisfied: true,
    }),
    '신청 당시 조건 충족',
  )
  assert.equal(
    requirementResult({
      evaluationBasis: 'METRIC_AT_APPLICATION',
      applicationRequirementSnapshot: snapshot,
      satisfied: false,
      reason: 'CHANNEL_METRIC_REQUIRED',
    }),
    '신청 당시 방문자 수 기록 없음',
  )
})
