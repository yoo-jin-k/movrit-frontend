import test from 'node:test'
import assert from 'node:assert/strict'
import {
  manageActionsFor,
  managePayload,
  progressOf,
  recruitmentSummary,
} from '../src/features/business/selectionEditModel.js'

test('상태별로 할 수 있는 선정 편집만 보여줍니다', () => {
  assert.deepEqual(
    manageActionsFor('SELECTED').map((a) => a.action),
    ['unselect', 'cancel'],
  )
  assert.deepEqual(
    manageActionsFor('ACTIVE').map((a) => a.action),
    ['unselect', 'cancel'],
  )
  // 체험 완료를 확인한 참여자는 선정 취소 대신 참여 취소만 할 수 있습니다.
  assert.deepEqual(
    manageActionsFor('ACTIVE', { experienceConfirmed: true }).map(
      (a) => a.action,
    ),
    ['cancel'],
  )
  assert.deepEqual(
    manageActionsFor('REJECTED').map((a) => a.action),
    ['restore'],
  )
  assert.deepEqual(manageActionsFor('CONTENT_SUBMITTED'), [])
  assert.deepEqual(manageActionsFor('SUBMITTED'), [])
})

test('참여 취소는 사유가 필요합니다', () => {
  const [, cancel] = manageActionsFor('SELECTED')
  assert.throws(() => managePayload(cancel, '  '), /사유/)
  assert.deepEqual(managePayload(cancel, ' 일정 문제 '), {
    action: 'cancel',
    reason: '일정 문제',
  })
  const [unselect] = manageActionsFor('SELECTED')
  assert.deepEqual(managePayload(unselect, ''), {
    action: 'unselect',
    reason: null,
  })
})

test('모집 현황: 선정·신청 인원과 남은 자리를 셉니다', () => {
  const apps = [
    { status: 'SELECTED' },
    { status: 'ACTIVE' },
    { status: 'SUBMITTED' },
    { status: 'CANCELLED' },
    { status: 'REJECTED' },
  ]
  assert.deepEqual(recruitmentSummary(apps, 3), {
    applied: 4,
    selected: 2,
    capacity: 3,
    remaining: 1,
  })
})

test('진행 단계: 선정되면 바로 참여 중 단계, 미선정·취소는 종료 안내', () => {
  assert.equal(progressOf('ACTIVE').index, 1)
  assert.equal(progressOf('SELECTED').index, 1)
  assert.equal(progressOf('REVISION_REQUESTED').index, 2)
  assert.match(progressOf('CANCELLED').ended, /취소/)
})
