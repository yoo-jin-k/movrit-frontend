import test from 'node:test'
import assert from 'node:assert/strict'
import {
  contentSubmissionAllowed,
  myParticipationAction,
  myContentPayload,
  myContentLink,
} from '../src/features/membership/myContentModel.js'
const active = {
  id: 12,
  status: 'ACTIVE',
  experienceConfirmedAt: '2026-10-18T12:00:00',
}
const revision = { ...active, status: 'REVISION_REQUESTED' }
const content = { applicationId: 12, status: 'REVISION_REQUESTED', version: 0 }
test('최초 제출은 체험 확인된 참여 중에만 허용하며 기대 버전은 null이다', () => {
  assert.equal(contentSubmissionAllowed(active, null), true)
  assert.equal(
    contentSubmissionAllowed({ ...active, experienceConfirmedAt: null }, null),
    false,
  )
  for (const status of [
    'SUBMITTED',
    'SELECTED',
    'CONTENT_SUBMITTED',
    'COMPLETED',
    'CANCELLED',
  ])
    assert.equal(contentSubmissionAllowed({ ...active, status }, null), false)
  assert.deepEqual(
    myContentPayload(active, null, ' https://example.com/post ', ' 메모 '),
    {
      contentUrl: 'https://example.com/post',
      note: '메모',
      expectedVersion: null,
    },
  )
})
test('재제출은 본인 신청·수정 요청·현재 버전 모두 일치해야 한다', () => {
  assert.equal(
    myContentPayload(revision, content, 'https://example.com', '')
      .expectedVersion,
    0,
  )
  for (const patch of [
    { applicationId: 99 },
    { version: null },
    { status: 'BRAND_APPROVED' },
    { status: 'APPROVED' },
    { status: 'SUBMITTED' },
  ])
    assert.equal(
      contentSubmissionAllowed(revision, { ...content, ...patch }),
      false,
    )
})
test('빈 URL·실행 URL·인증 포함 URL·길이 초과를 거부한다', () => {
  for (const url of [
    '',
    'javascript:alert(1)',
    'https://user:pass@example.com',
    'https://example.com/' + 'a'.repeat(1000),
  ])
    assert.throws(() => myContentPayload(active, null, url, ''))
  assert.throws(() =>
    myContentPayload(active, null, 'https://example.com', 'a'.repeat(2001)),
  )
  assert.equal(myContentLink('javascript:alert(1)'), null)
})

test('참여 수락과 체험 확인을 서버 상태에 따라 별도 명령으로 제공한다', () => {
  assert.equal(
    myParticipationAction({ ...active, status: 'SELECTED' }),
    'activate',
  )
  assert.equal(
    myParticipationAction({ ...active, experienceConfirmedAt: null }),
    'experience-confirm',
  )
  assert.equal(myParticipationAction(active), null)
  assert.equal(myParticipationAction(revision), null)
  assert.equal(myParticipationAction({ status: 'CANCELLED' }), null)
})
