// 운영자 참여자 선정 화면의 지표 표시·준비 상태·처리 결과 반영 규칙을 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  actionErrorMessage,
  actionResultMessage,
  applicationTone,
  filterApplications,
  mergeActionResult,
  metricLines,
  readinessItems,
} from '../src/features/admin/adminApplicationModel.js'

test('채널 지표를 한 줄씩 만들고, 지표가 없거나 형식이 다르면 구분합니다', () => {
  const lines = metricLines([
    {
      channelType: 'INSTAGRAM',
      metricType: 'FOLLOWER_COUNT',
      metricName: '팔로워 수',
      value: 12000,
      verificationStatus: 'VERIFIED',
    },
  ])
  assert.equal(lines[0].channel, '인스타그램')
  assert.equal(lines[0].text, '팔로워 수 12,000')
  assert.equal(lines[0].verification, '확인됨')
  assert.deepEqual(metricLines([]), [])
  assert.equal(metricLines(undefined), null)
})

test('본인 인증 기능이 꺼져 있으면 준비 상태에서 그 항목을 뺍니다', () => {
  assert.deepEqual(
    readinessItems({ emailVerified: true, channelReady: false }),
    [
      ['이메일 인증', true],
      ['활동 채널 등록', false],
    ],
  )
  assert.equal(
    readinessItems({
      identityVerificationConfigured: true,
      identityVerified: true,
    }).length,
    3,
  )
})

test('상태와 검색어로 신청을 거릅니다', () => {
  const rows = [
    {
      id: 1,
      status: 'SUBMITTED',
      creatorNickname: '민지',
      campaignTitle: '향수',
      campaignId: 4,
    },
    {
      id: 2,
      status: 'ACTIVE',
      creatorNickname: '하늘',
      campaignTitle: '카페',
      campaignId: 5,
    },
  ]
  assert.deepEqual(
    filterApplications(rows, { status: 'SUBMITTED' }).map((r) => r.id),
    [1],
  )
  assert.deepEqual(
    filterApplications(rows, { search: '카페' }).map((r) => r.id),
    [2],
  )
})

test('처리 응답으로 상태를 바꾸되 응답에 없는 지표·완료 이력은 유지합니다', () => {
  const selected = {
    id: 3,
    status: 'SUBMITTED',
    creatorMetrics: [{ channelType: 'INSTAGRAM' }],
    completedCampaignCount: 2,
  }
  const merged = mergeActionResult(selected, {
    id: 3,
    status: 'SELECTED',
    creatorMetrics: null,
    completedCampaignCount: null,
  })
  assert.equal(merged.status, 'SELECTED')
  assert.equal(merged.completedCampaignCount, 2)
  assert.equal(merged.creatorMetrics.length, 1)
  // 다른 신청의 응답이면 바꾸지 않습니다.
  assert.equal(
    mergeActionResult(selected, { id: 9, status: 'REJECTED' }),
    selected,
  )
})

test('처리 결과·실패 문구와 상태 색을 정합니다', () => {
  assert.match(
    actionResultMessage('select', { creatorNickname: '민지' }),
    /민지 님을 선정/,
  )
  assert.match(actionResultMessage('reject', { id: 7 }), /신청 #7을 미선정/)
  assert.match(actionErrorMessage(409), /정원/)
  assert.match(actionErrorMessage(500), /최신 목록/)
  assert.equal(applicationTone('SUBMITTED'), 'warning')
  assert.equal(applicationTone('ACTIVE'), 'success')
  assert.equal(applicationTone('REJECTED'), 'danger')
})
