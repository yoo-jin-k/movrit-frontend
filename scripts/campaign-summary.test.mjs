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

test('단계 요약을 누르면 그 단계로 걸러진 내 캠페인 목록 주소로 갑니다', async () => {
  const {
    CAMPAIGN_STAGES,
    stageLink,
    filterFromParams,
    matchesFilter,
    paramsFromFilter,
  } = await import('../src/features/membership/campaignSummaryModel.js')
  const links = Object.fromEntries(
    CAMPAIGN_STAGES.map((stage) => [stage.label, stageLink(stage)]),
  )
  assert.equal(links['신청'], '/mypage/campaigns?status=SUBMITTED')
  assert.equal(links['선정'], '/mypage/campaigns?status=SELECTED')
  assert.equal(links['진행'], '/mypage/campaigns?stage=progress')
  assert.equal(links['완료'], '/mypage/campaigns?status=COMPLETED')
  const known = [
    'SUBMITTED',
    'SELECTED',
    'ACTIVE',
    'CONTENT_SUBMITTED',
    'REVISION_REQUESTED',
    'COMPLETED',
  ]
  const progress = filterFromParams(
    new URLSearchParams('stage=progress'),
    known,
  )
  assert.equal(progress, 'stage:progress')
  // 진행 단계는 참여 중·제출·수정 요청을 모두 보여주고, 완료는 넣지 않습니다.
  for (const status of ['ACTIVE', 'CONTENT_SUBMITTED', 'REVISION_REQUESTED'])
    assert.equal(matchesFilter(status, progress), true)
  assert.equal(matchesFilter('COMPLETED', progress), false)
  assert.equal(
    filterFromParams(new URLSearchParams('status=COMPLETED'), known),
    'COMPLETED',
  )
  // 모르는 값은 전체 보기로 둡니다.
  assert.equal(filterFromParams(new URLSearchParams('status=HACK'), known), '')
  assert.equal(
    filterFromParams(new URLSearchParams('stage=applied'), known),
    '',
  )
  assert.deepEqual(paramsFromFilter('stage:progress'), { stage: 'progress' })
  assert.deepEqual(paramsFromFilter('COMPLETED'), { status: 'COMPLETED' })
  assert.deepEqual(paramsFromFilter(''), {})
})
