// 참여 조정(철회·취소·연장), 내 캠페인 달력, 방문형 선착순, 채널 기본 요건의 화면 규칙을 확인합니다.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calendarEvents,
  cancelCountText,
  evidenceError,
  eventsOnDay,
  extensionError,
  initialCalendarMonth,
  reasonError,
} from '../src/features/participation/participationChangeModel.js'
import {
  SELECTION_MODES,
  applySelectionModeRules,
  canSelectApplication,
  firstComeError,
  selectionModeField,
} from '../src/features/business/selectionModeModel.js'
import {
  CHANNEL_DEFAULTS,
  applyChannelDefaults,
  changeChannelWithDefaults,
  hasChannelDefaults,
} from '../src/features/sellerCampaigns/channelRequirementModel.js'
import { notificationPath } from '../src/features/business/notificationModel.js'
import { adaptCampaignSummary } from '../src/features/discovery/campaignReadAdapter.js'

test('취소·연장 사유와 증빙 이미지를 미리 확인합니다', () => {
  assert.equal(reasonError(''), '사유를 입력해 주세요.')
  assert.equal(reasonError('', { required: false }), '')
  assert.match(reasonError('가'.repeat(501)), /500자/)
  assert.equal(reasonError('일정이 겹쳤습니다.'), '')
  assert.match(evidenceError(null), /첨부/)
  assert.match(evidenceError({ type: 'image/gif', size: 10 }), /JPG·PNG/)
  assert.match(
    evidenceError({ type: 'image/png', size: 6 * 1024 * 1024 }),
    /5MB/,
  )
  assert.equal(evidenceError({ type: 'image/jpeg', size: 1000 }), '')
  assert.match(extensionError(3, '사유'), /7일 또는 14일/)
  assert.equal(extensionError(14, '촬영 일정 조율'), '')
})

test('취소 횟수 안내는 현재 횟수와 기준을 함께 보여 줍니다', () => {
  assert.match(cancelCountText(2, 5), /^취소 2\/5회/)
  assert.match(cancelCountText(undefined), /^취소 0\/5회/)
})

test('달력은 연장된 마감을 쓰고 미선정·취소 신청은 빼며, 선정 발표는 접수 상태에만 둡니다', () => {
  const campaign = (id, extra = {}) => ({
    id,
    title: `캠페인 ${id}`,
    selectionAnnouncedAt: '2026-11-05T10:00:00',
    experienceStartAt: '2026-11-06T10:00:00',
    contentSubmissionEndAt: '2026-11-20T23:59:00',
    resultsAnnouncedAt: null,
    ...extra,
  })
  const events = calendarEvents([
    {
      application: { id: 1, campaignId: 10, status: 'SUBMITTED' },
      campaign: campaign(10),
    },
    {
      application: {
        id: 2,
        campaignId: 11,
        status: 'ACTIVE',
        contentDeadlineExtendedUntil: '2026-11-27T23:59:00',
      },
      campaign: campaign(11),
    },
    {
      application: { id: 3, campaignId: 12, status: 'CANCELLED' },
      campaign: campaign(12),
    },
  ])
  assert.deepEqual(
    events.map((e) => `${e.applicationId}:${e.stage}:${e.day}`),
    [
      '1:selection:2026-11-05',
      '1:experience:2026-11-06',
      '2:experience:2026-11-06',
      '1:submission:2026-11-20',
      '2:submission:2026-11-27',
    ],
  )
  assert.equal(events.at(-1).extended, true)
  assert.equal(eventsOnDay(events, '2026-11-06').length, 2)
  assert.deepEqual(initialCalendarMonth(events, '2026-11-03'), {
    year: 2026,
    month: 11,
  })
  assert.deepEqual(initialCalendarMonth([], '2027-01-15'), {
    year: 2027,
    month: 1,
  })
})

test('선착순은 방문형 전용이고 선정 명령을 열지 않습니다', () => {
  assert.equal(SELECTION_MODES.FIRST_COME, '선착순 (방문형)')
  const picked = applySelectionModeRules(
    { selectionMode: 'BRAND_DIRECT', campaignType: 'PRODUCT' },
    { selectionMode: 'FIRST_COME', campaignType: 'PRODUCT' },
  )
  assert.equal(picked.form.campaignType, 'LOCAL')
  assert.deepEqual(picked.fulfillment, ['VISIT'])
  const moved = applySelectionModeRules(
    { selectionMode: 'FIRST_COME', campaignType: 'LOCAL' },
    { selectionMode: 'FIRST_COME', campaignType: 'PRODUCT' },
  )
  assert.equal(moved.form.selectionMode, 'BRAND_DIRECT')
  assert.equal(moved.fulfillment, null)
  assert.match(
    firstComeError({ selectionMode: 'FIRST_COME' }, ['VISIT', 'DELIVERY']),
    /방문 참여만/,
  )
  assert.equal(firstComeError({ selectionMode: 'FIRST_COME' }, ['VISIT']), '')
  assert.equal(firstComeError({ selectionMode: 'BRAND_DIRECT' }, []), '')
  assert.deepEqual(selectionModeField({ selectionMode: 'FIRST_COME' }), {
    selectionMode: 'FIRST_COME',
  })
  assert.equal(
    canSelectApplication({ status: 'SUBMITTED' }, 'FIRST_COME', 'brand'),
    false,
  )
  assert.equal(
    adaptCampaignSummary({
      id: 1,
      title: '선착순',
      selectionMode: 'FIRST_COME',
    }).firstCome,
    true,
  )
  assert.equal(adaptCampaignSummary({ id: 2, title: '일반' }).firstCome, false)
})

test('채널 기본 요건은 비어 있는 칸만 채웁니다', () => {
  assert.equal(hasChannelDefaults('BLOG'), true)
  assert.equal(hasChannelDefaults('OTHER'), false)
  const empty = applyChannelDefaults({
    contentChannel: 'INSTAGRAM',
    submissionRequirement: '',
    channelGuide: '  ',
  })
  assert.deepEqual(empty.filled, ['submissionRequirement', 'channelGuide'])
  assert.match(empty.next.submissionRequirement, /브랜드 계정 태그/)
  const kept = applyChannelDefaults({
    contentChannel: 'BLOG',
    submissionRequirement: '업체가 직접 쓴 요건',
    channelGuide: '',
  })
  assert.deepEqual(kept.filled, ['channelGuide'])
  assert.equal(kept.next.submissionRequirement, '업체가 직접 쓴 요건')
  assert.deepEqual(applyChannelDefaults({ contentChannel: '' }).filled, [])
})

test('채널을 고르면 기본 요건을 자동으로 채우고, 업체가 고친 칸은 그대로 둡니다', () => {
  // 처음 채널을 고르면 빈 칸이 채워집니다.
  const blog = changeChannelWithDefaults(
    { contentChannel: '', submissionRequirement: '', channelGuide: '' },
    'BLOG',
  )
  assert.deepEqual(blog.changed, ['submissionRequirement', 'channelGuide'])
  assert.equal(blog.next.contentChannel, 'BLOG')
  assert.equal(
    blog.next.submissionRequirement,
    CHANNEL_DEFAULTS.BLOG.submissionRequirement,
  )
  // 업체가 안내 문구를 고친 뒤 채널을 바꾸면, 고친 칸은 그대로 두고 기본 문구 칸만 바꿉니다.
  const edited = { ...blog.next, channelGuide: '업체가 직접 쓴 안내' }
  const insta = changeChannelWithDefaults(edited, 'INSTAGRAM')
  assert.deepEqual(insta.changed, ['submissionRequirement'])
  assert.equal(
    insta.next.submissionRequirement,
    CHANNEL_DEFAULTS.INSTAGRAM.submissionRequirement,
  )
  assert.equal(insta.next.channelGuide, '업체가 직접 쓴 안내')
  // 기본 요건이 없는 채널로 바꾸면 기본 문구를 그대로 둔 칸은 비웁니다.
  const other = changeChannelWithDefaults(insta.next, 'OTHER')
  assert.equal(other.next.submissionRequirement, '')
  assert.equal(other.next.channelGuide, '업체가 직접 쓴 안내')
  // 수정 화면에서 업체가 직접 쓴 요건이 있으면 채널을 바꿔도 덮어쓰지 않습니다.
  const own = changeChannelWithDefaults(
    {
      contentChannel: 'BLOG',
      submissionRequirement: '직접 쓴 요건',
      channelGuide: '',
    },
    'YOUTUBE',
  )
  assert.deepEqual(own.changed, ['channelGuide'])
  assert.equal(own.next.submissionRequirement, '직접 쓴 요건')
})

test('협의 취소·패널티 알림은 담당 화면으로 이동합니다', () => {
  assert.equal(
    notificationPath({ targetType: 'ADMIN_CANCEL_REQUEST', targetId: 3 }),
    '/admin/participation',
  )
  assert.equal(
    notificationPath({ targetType: 'CAMPAIGN_PENALTY', targetId: 9 }),
    '/mypage',
  )
})
