// 제출 전 점검 요청 만들기, 응답 형식 검사, 결과 정렬, 오류 안내를 확인합니다.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  PRECHECK_CONTENT_MAX,
  precheckAvailable,
  precheckError,
  precheckRequest,
  precheckView,
  validPrecheck,
} from '../src/features/membership/contentPrecheckModel.js'

const result = {
  summary: '사진 수를 확인해 주세요.',
  items: [
    { criterion: '협찬 표시', status: 'MET', comment: '' },
    { criterion: '사진 3장', status: 'UNCLEAR', comment: '확인' },
    { criterion: '키워드', status: 'MISSING', comment: '넣어 주세요' },
  ],
  disclosureFound: true,
  live: true,
  model: 'model-x',
  remainingToday: 9,
}

test('본문을 다듬고 채널이 없으면 null로 보냅니다', () => {
  assert.deepEqual(precheckRequest('  본문  ', ''), {
    content: '본문',
    channelType: null,
  })
  assert.equal(precheckRequest('본문', 'BLOG').channelType, 'BLOG')
})

test('빈 본문과 너무 긴 본문은 요청 전에 막습니다', () => {
  assert.throws(() => precheckRequest('   '), /붙여 넣어/)
  assert.throws(
    () => precheckRequest('가'.repeat(PRECHECK_CONTENT_MAX + 1)),
    /8,000자/,
  )
})

test('정해진 형식만 결과로 받습니다', () => {
  assert.equal(validPrecheck(result), true)
  assert.equal(validPrecheck({ ...result, items: [] }), false)
  assert.equal(
    validPrecheck({
      ...result,
      items: [{ criterion: 'x', status: 'PASS' }],
    }),
    false,
  )
  assert.equal(validPrecheck({ ...result, disclosureFound: 'yes' }), false)
  assert.equal(validPrecheck(null), false)
})

test('보완 필요 항목을 먼저 보이고 개수를 셉니다', () => {
  const view = precheckView(result)
  assert.deepEqual(
    view.items.map((i) => i.status),
    ['MISSING', 'UNCLEAR', 'MET'],
  )
  assert.deepEqual([view.missing, view.unclear, view.met], [1, 1, 1])
  assert.equal(result.items[0].status, 'MET')
})

test('서버 설명을 먼저, 없으면 상태별 한국어 안내를 씁니다', () => {
  assert.equal(
    precheckError({
      response: { status: 429, data: { detail: '오늘 다 썼습니다' } },
    }),
    '오늘 다 썼습니다',
  )
  assert.match(precheckError({ response: { status: 409 } }), /준비하는 단계/)
  assert.match(
    precheckError({ response: { status: 418 } }),
    /점검하지 못했습니다/,
  )
  assert.match(precheckError(new Error('Network Error')), /연결하지 못했습니다/)
  assert.equal(
    precheckError(new Error('점검 결과를 확인할 수 없습니다.')),
    '점검 결과를 확인할 수 없습니다.',
  )
})

test('참여 중·수정 요청 신청에서만 점검 영역을 보입니다', () => {
  assert.equal(precheckAvailable({ status: 'ACTIVE' }), true)
  assert.equal(precheckAvailable({ status: 'REVISION_REQUESTED' }), true)
  for (const status of [
    'SUBMITTED',
    'CONTENT_SUBMITTED',
    'COMPLETED',
    'CANCELLED',
  ])
    assert.equal(precheckAvailable({ status }), false)
  assert.equal(precheckAvailable(null), false)
})
