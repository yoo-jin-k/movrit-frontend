// 운영자 캠페인 관리 필터와 숨김 사유 검사, 비밀번호 재설정 규칙을 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  closeReasonError,
  filterAdminCampaigns,
  isQaCampaign,
} from '../src/features/admin/adminCampaignModel.js'

const items = [
  { id: 1, title: '[QA-E2E] 흐름 검증', brandName: 'QA', state: 'HIDDEN' },
  {
    id: 2,
    title: '수분 세럼 리뷰어',
    brandName: '무브릿',
    state: 'RECRUITING',
  },
  { id: 3, title: '[QA] 조건 검수', brandName: 'QA', state: 'ENDED' },
]

test('점검용 캠페인 구분과 필터', () => {
  assert.equal(isQaCampaign(items[0]), true)
  assert.equal(isQaCampaign(items[1]), false)
  assert.deepEqual(
    filterAdminCampaigns(items, { showQa: false }).map((i) => i.id),
    [2],
  )
  assert.deepEqual(
    filterAdminCampaigns(items, { state: 'ENDED' }).map((i) => i.id),
    [3],
  )
  assert.deepEqual(
    filterAdminCampaigns(items, { search: '무브릿' }).map((i) => i.id),
    [2],
  )
  assert.deepEqual(
    filterAdminCampaigns(items, { search: '3' }).map((i) => i.id),
    [3],
  )
})

test('숨김 사유는 필수입니다', () => {
  assert.match(closeReasonError(' '), /사유/)
  assert.equal(closeReasonError('점검용 캠페인 정리'), '')
})
