// 참여 운영 화면 규칙(일괄 처리, 방문 예약, 패널티, 신고, 캠페인 복제)을 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  bulkSelectable,
  bulkSummary,
  nextGradeText,
  penaltyOptions,
  reportActionsFor,
  reportError,
  reservationError,
  stars,
  visitLabel,
} from '../src/features/participation/participationModel.js'
import {
  copiedApplicationForm,
  copiedCampaignForm,
  copiedMediaDraft,
} from '../src/features/sellerCampaigns/campaignCopy.js'

test('일괄 처리는 브랜드 직접 선정 캠페인의 접수 신청만, 결과 요약', () => {
  assert.equal(bulkSelectable({ status: 'SUBMITTED' }, 'BRAND_DIRECT'), true)
  assert.equal(bulkSelectable({ status: 'SUBMITTED' }, 'OPERATOR'), false)
  assert.equal(bulkSelectable({ status: 'ACTIVE' }, 'BRAND_DIRECT'), false)
  assert.equal(
    bulkSummary(
      { successCount: 2, results: [{ success: true }, { success: true }] },
      '선정',
    ),
    '선정 2건 완료했습니다.',
  )
  assert.match(
    bulkSummary(
      {
        successCount: 1,
        results: [
          { success: true },
          { success: false, message: '모집 인원이 모두 찼습니다.' },
        ],
      },
      '선정',
    ),
    /1건은 처리하지 못했습니다\(모집 인원이 모두 찼습니다\.\)/,
  )
})

test('방문 예약 입력 확인과 표시', () => {
  const now = new Date('2026-11-02T12:00:00')
  assert.equal(
    reservationError({ visitAt: '2026-11-05T13:00', partySize: '2' }, now),
    '',
  )
  assert.match(reservationError({ visitAt: '', partySize: '1' }, now), /골라/)
  assert.match(
    reservationError({ visitAt: '2026-11-01T13:00', partySize: '1' }, now),
    /이후/,
  )
  assert.match(
    reservationError({ visitAt: '2026-11-05T13:00', partySize: '11' }, now),
    /1~10명/,
  )
  assert.equal(visitLabel('2026-11-05T09:30:00'), '11월 5일 09:30')
})

test('패널티는 마감·방문 일시가 지난 뒤에만', () => {
  const now = new Date('2026-11-10T12:00:00')
  const active = { status: 'ACTIVE', fulfillmentType: 'VISIT' }
  assert.deepEqual(
    penaltyOptions(
      active,
      { contentSubmissionEndAt: '2026-11-09T23:59:00' },
      null,
      now,
    ),
    ['NO_SUBMIT'],
  )
  assert.deepEqual(
    penaltyOptions(
      active,
      { contentSubmissionEndAt: '2026-11-11T23:59:00' },
      null,
      now,
    ),
    [],
  )
  assert.deepEqual(
    penaltyOptions(
      active,
      null,
      { status: 'CONFIRMED', visitAt: '2026-11-09T12:00:00' },
      now,
    ),
    ['NO_SHOW'],
  )
  assert.deepEqual(
    penaltyOptions(
      { ...active, experienceConfirmedAt: '2026-11-09T13:00:00' },
      null,
      { status: 'CONFIRMED', visitAt: '2026-11-09T12:00:00' },
      now,
    ),
    [],
  )
  assert.equal(stars(4), '★★★★☆')
  assert.equal(
    nextGradeText({ nextGradeLabel: '실버', remainingToNext: 2 }),
    '실버까지 완료 2회 남았습니다.',
  )
})

test('신고 사유 확인, 캠페인 콘텐츠는 가리기 없음', () => {
  assert.match(reportError({ reason: '' }), /사유/)
  assert.match(reportError({ reason: 'OTHER', detail: ' ' }), /기타/)
  assert.equal(reportError({ reason: 'SPAM' }), '')
  assert.equal(
    reportActionsFor('CAMPAIGN_CONTENT').some(([code]) => code === 'HIDE'),
    false,
  )
  assert.equal(
    reportActionsFor('CHAT_MESSAGE').some(([code]) => code === 'HIDE'),
    true,
  )
})

test('캠페인 복제는 기간·일정·프리오더를 비우고 나머지를 가져옴', () => {
  const form = copiedCampaignForm(
    {
      title: '수분 세럼 리뷰',
      brandName: 'QA DESIGN',
      selectionMode: 'BRAND_DIRECT',
      campaignType: 'LOCAL',
      region: '서울',
      contentChannel: null,
      recruitmentCount: 3,
      mission: '7일 사용 후기',
      startAt: '2026-11-01T00:00:00',
      contentSubmissionEndAt: '2026-11-20T23:59:00',
      preorderId: 5,
    },
    [{ id: 7, name: 'QA DESIGN' }],
  )
  assert.equal(form.title, '[복제] 수분 세럼 리뷰')
  assert.equal(form.brandId, 7)
  assert.equal(form.region, '서울')
  assert.equal(form.contentChannel, '')
  assert.equal(form.recruitmentCount, '3')
  assert.equal(form.mission, '7일 사용 후기')
  assert.equal(form.startAt, '')
  assert.equal(form.contentSubmissionEndAt, '')
  assert.equal(form.preorderId, '')
  assert.deepEqual(
    copiedApplicationForm({
      version: 3,
      allowedFulfillmentTypes: ['VISIT'],
      questions: [{ id: 'q1', options: ['a'] }],
      agreements: [],
    }),
    {
      allowedFulfillmentTypes: ['VISIT'],
      questions: [{ id: 'q1', options: ['a'] }],
      agreements: [],
    },
  )
  const draft = copiedMediaDraft(
    {
      representative: {
        key: 'old',
        assetId: 'a1',
        file: 'FILE',
        status: 'existing',
      },
      details: [{ key: 'd', assetId: 'a2', file: null }],
      location: { address: '서울' },
      locationConfirmed: true,
    },
    () => 'new',
  )
  assert.deepEqual(draft.representative, {
    key: 'new',
    file: 'FILE',
    altText: '',
    status: 'pending',
  })
  assert.equal(draft.details.length, 0)
  assert.equal(draft.locationConfirmed, false)
})
