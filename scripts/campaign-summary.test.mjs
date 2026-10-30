import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeCampaignStages } from '../src/features/membership/campaignSummaryModel.js'

// 마이페이지 요약 단계 집계 규칙만 검증합니다. 서버 연동 성공을 의미하지 않습니다.
test('신청 상태를 신청·선정·진행·완료 단계로 묶어 셉니다', () => {
  const stages = summarizeCampaignStages([
    { status: 'SUBMITTED' },
    { status: 'SUBMITTED' },
    { status: 'SELECTED' },
    { status: 'ACTIVE' },
    { status: 'CONTENT_SUBMITTED' },
    { status: 'REVISION_REQUESTED' },
    { status: 'COMPLETED' },
  ])
  assert.deepEqual(
    stages.map(({ key, count }) => [key, count]),
    [
      ['applied', 2],
      ['selected', 1],
      ['progress', 3],
      ['completed', 1],
    ],
  )
})
test('미선정·취소는 어느 단계에도 포함하지 않습니다', () => {
  const stages = summarizeCampaignStages([
    { status: 'REJECTED' },
    { status: 'CANCELLED' },
  ])
  assert.equal(
    stages.reduce((sum, stage) => sum + stage.count, 0),
    0,
  )
})
test('단일 상태 단계만 상태 필터 값을 가집니다', () => {
  const stages = summarizeCampaignStages([])
  assert.equal(stages.find((s) => s.key === 'applied').status, 'SUBMITTED')
  assert.equal(stages.find((s) => s.key === 'progress').status, null)
})
test('목록이 아닌 응답은 0건으로 위장하지 않습니다', () => {
  assert.equal(summarizeCampaignStages({ data: [] }), null)
})
