// 운영자 커뮤니티 관리와 운영 리포트 기간 규칙을 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  boardLabel,
  postMeta,
  visibilityAction,
  visibilityError,
} from '../src/features/admin/communityAdminModel.js'
import {
  dailyTotals,
  presetRange,
  rangeError,
  rangeLabel,
  reportPath,
} from '../src/features/admin/reportPeriodModel.js'

test('커뮤니티: 상태별 버튼과 표시', () => {
  assert.deepEqual(visibilityAction('VISIBLE'), {
    hidden: true,
    label: '가리기',
  })
  assert.deepEqual(visibilityAction('HIDDEN'), {
    hidden: false,
    label: '다시 보이기',
  })
  assert.equal(visibilityAction('DELETED'), null)
  assert.equal(boardLabel('free'), 'MOVRIT 톡톡')
  assert.equal(
    postMeta({ viewCount: 3, commentCount: 2, hiddenCommentCount: 1 }),
    '조회 3 · 댓글 2 · 가린 댓글 1',
  )
  assert.equal(
    postMeta({ viewCount: 0, commentCount: 0, hiddenCommentCount: 0 }),
    '조회 0 · 댓글 0',
  )
})

test('커뮤니티: 오류 문구', () => {
  assert.equal(
    visibilityError({
      response: { status: 409, data: { detail: '이미 가린 글입니다.' } },
    }),
    '이미 가린 글입니다.',
  )
  assert.match(visibilityError({ response: { status: 403 } }), /운영자만/)
  assert.match(visibilityError(new Error('network')), /잠시 후/)
})

test('리포트: 프리셋 기간', () => {
  const today = new Date(2026, 10, 3)
  assert.deepEqual(presetRange('7d', today), {
    from: '2026-10-28',
    to: '2026-11-03',
  })
  assert.deepEqual(presetRange('30d', today), {
    from: '2026-10-05',
    to: '2026-11-03',
  })
  assert.deepEqual(presetRange('month', today), {
    from: '2026-11-01',
    to: '2026-11-03',
  })
  assert.deepEqual(presetRange('all', today), { from: '', to: '' })
})

test('리포트: 직접 고른 기간 확인과 주소', () => {
  assert.equal(rangeError({ from: '', to: '' }), '')
  assert.match(rangeError({ from: '2026-11-01', to: '' }), /모두/)
  assert.match(rangeError({ from: '2026-11-02', to: '2026-11-01' }), /늦습니다/)
  assert.equal(rangeError({ from: '2025-11-03', to: '2026-11-03' }), '')
  assert.match(rangeError({ from: '2025-11-02', to: '2026-11-03' }), /1년/)
  assert.equal(reportPath({ from: '', to: '' }), '/admin/reports')
  assert.equal(
    reportPath({ from: '2026-11-01', to: '2026-11-03' }),
    '/admin/reports?from=2026-11-01&to=2026-11-03',
  )
})

test('리포트: 기간 문구와 합계', () => {
  assert.equal(rangeLabel({ from: null }), '전체 기간')
  assert.equal(
    rangeLabel({ from: '2026-11-01', to: '2026-11-01' }),
    '2026-11-01',
  )
  assert.deepEqual(
    dailyTotals([
      { signups: 1, applications: 2, contents: 0, completed: 0 },
      { signups: 0, applications: 1, contents: 1, completed: 1 },
    ]),
    { signups: 1, applications: 3, contents: 1, completed: 1 },
  )
})
