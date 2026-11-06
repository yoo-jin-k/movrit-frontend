import test from 'node:test'
import assert from 'node:assert/strict'
import {
  contentLinks,
  myContentLinksPayload,
} from '../src/features/membership/myContentModel.js'
import {
  nextCampaignAction,
  workspaceTime,
  submissionWindowMessage,
} from '../src/features/membership/campaignWorkspaceModel.js'
const active = {
  id: 1,
  status: 'ACTIVE',
  experienceConfirmedAt: '2026-10-29T10:00:00',
}
const instagram = {
  channelType: 'INSTAGRAM',
  contentUrl: 'https://www.instagram.com/p/qaExample/',
}
test('채널별 제출은 기존 버전과 모든 링크를 보존하며 채널을 추정하지 않습니다', () => {
  const submission = {
    applicationId: 1,
    status: 'REVISION_REQUESTED',
    version: 0,
  }
  const payload = myContentLinksPayload(
    { ...active, status: 'REVISION_REQUESTED' },
    submission,
    [
      instagram,
      { channelType: 'BLOG', contentUrl: 'https://example.com/post' },
    ],
    ' 메모 ',
  )
  assert.equal(payload.expectedVersion, 0)
  assert.equal(payload.links.length, 2)
  assert.equal(payload.note, '메모')
  assert.deepEqual(contentLinks({ contentUrl: instagram.contentUrl }), [
    { channelType: '', contentUrl: instagram.contentUrl },
  ])
  assert.throws(() =>
    myContentLinksPayload(
      active,
      null,
      contentLinks({ contentUrl: instagram.contentUrl }),
      '',
    ),
  )
})
test('인스타 호스트 위장·프로필 주소·중복 링크·6개 링크·선정전 제출을 거부합니다', () => {
  for (const contentUrl of [
    'https://instagram.com.evil.test/p/a',
    'https://www.instagram.com/profile/',
    'javascript:alert(1)',
  ])
    assert.throws(() =>
      myContentLinksPayload(active, null, [{ ...instagram, contentUrl }], ''),
    )
  assert.throws(() =>
    myContentLinksPayload(active, null, [instagram, instagram], ''),
  )
  assert.throws(() =>
    myContentLinksPayload(
      active,
      null,
      Array.from({ length: 6 }, (_, i) => ({
        ...instagram,
        contentUrl: instagram.contentUrl + i,
      })),
      '',
    ),
  )
  assert.throws(() =>
    myContentLinksPayload(
      { ...active, status: 'SELECTED' },
      null,
      [instagram],
      '',
    ),
  )
})
test('누락 일정은 생성하지 않고 업체 승인과 최종 승인을 구분합니다', () => {
  assert.equal(workspaceTime(null), '미등록')
  assert.equal(workspaceTime('invalid'), '미등록')
  assert.match(workspaceTime('2026-12-01T00:00:00'), /2026.*12.*01.*00:00/)
  assert.match(
    nextCampaignAction(active, { status: 'BRAND_APPROVED' }),
    /기다려/,
  )
  assert.match(
    nextCampaignAction(active, { status: 'APPROVED' }),
    /최종 승인이 완료/,
  )
  assert.match(
    nextCampaignAction({ ...active, experienceConfirmedAt: null }, null),
    /실제 체험 완료/,
  )
})

test('최초 제출은 시작·종료 경계를 안내하고 수정 요청 재제출은 마감 후에도 열립니다', () => {
  const campaign = {
    contentSubmissionStartAt: '2026-10-29T10:00:00',
    contentSubmissionEndAt: '2026-10-30T10:00:00',
  }
  assert.match(
    submissionWindowMessage(
      campaign,
      null,
      new Date('2026-10-29T09:59:59+09:00'),
    ),
    /부터/,
  )
  assert.equal(
    submissionWindowMessage(
      campaign,
      null,
      new Date('2026-10-29T10:00:00+09:00'),
    ),
    '',
  )
  assert.match(
    submissionWindowMessage(
      campaign,
      null,
      new Date('2026-10-30T10:00:00+09:00'),
    ),
    /종료/,
  )
  assert.equal(
    submissionWindowMessage(
      campaign,
      { status: 'REVISION_REQUESTED' },
      new Date('2026-11-01T00:00:00+09:00'),
    ),
    '',
  )
  assert.equal(submissionWindowMessage({}, null), '')
})

test('신청 날짜는 한국 시간 날짜로만 보여주고 없으면 미등록입니다', async () => {
  const { workspaceDate } = await import(
    '../src/features/membership/campaignWorkspaceModel.js'
  )
  assert.equal(workspaceDate('2026-11-05T23:30:00'), '2026. 11. 05.')
  assert.equal(workspaceDate(null), '미등록')
})
