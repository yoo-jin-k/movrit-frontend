import test from 'node:test'
import assert from 'node:assert/strict'
import {
  adaptCampaignList,
  adaptCampaignSummary,
  displayCampaignDate,
  validateCampaignForm,
} from '../src/features/discovery/campaignReadAdapter.js'

// 실제 DTO 구조를 검증하는 단위 테스트이며 서버 또는 DB 연동 성공을 의미하지 않습니다.
test('캠페인 ID를 프리오더 ID와 구분하고 미제공 필드를 추측하지 않습니다', () => {
  const item = adaptCampaignSummary({
    id: 9,
    preorderId: 100,
    title: '조회 검수',
    category: '뷰티',
    recruitmentCount: 4,
  })
  assert.equal(item.id, '9')
  assert.equal(item.campaign, true)
  assert.equal(item.preview, false)
  assert.equal(item.image, null)
  assert.equal(item.kind, null)
  assert.equal(item.applicants, null)
  assert.equal(item.daysLeft, null)
})
test('빈 목록은 빈 목록으로 유지하고 잘못된 envelope를 거부합니다', () => {
  assert.deepEqual(adaptCampaignList([]), [])
  assert.throws(() => adaptCampaignList({ data: [] }))
  assert.throws(() => adaptCampaignList([{ id: 1 }]))
})
test('시간대 미지정 날짜를 임의 변환하지 않습니다', () => {
  assert.equal(displayCampaignDate('2026-10-21T23:59:00'), '2026-10-21 23:59')
  assert.equal(displayCampaignDate(null), '미구성')
})
test('공개 폼의 버전과 선택 동의 여부를 보존합니다', () => {
  const form = {
    campaignId: 9,
    version: 2,
    allowedFulfillmentTypes: ['VISIT'],
    questions: [{ id: 'q', label: '방문 시간', required: true }],
    agreements: [
      { id: 'a', title: '선택 문서', version: 'v2', required: false },
    ],
  }
  assert.equal(validateCampaignForm(form), form)
  assert.equal(form.agreements[0].body, undefined)
  assert.throws(() => validateCampaignForm({ ...form, questions: null }))
})

test('보강된 질문 선택지와 동의문 본문을 보존하고 잘못된 형식을 거부합니다', () => {
  const form = {
    campaignId: 9,
    version: 3,
    allowedFulfillmentTypes: ['VISIT'],
    questions: [
      {
        id: 'q',
        label: '시간',
        required: true,
        type: 'SINGLE_CHOICE',
        options: ['오전', '오후'],
        maxLength: null,
      },
    ],
    agreements: [
      {
        id: 'a',
        title: '동의문',
        version: 'v3',
        required: true,
        body: '문서 본문 예시',
      },
    ],
  }
  assert.equal(validateCampaignForm(form).agreements[0].body, '문서 본문 예시')
  assert.deepEqual(form.questions[0].options, ['오전', '오후'])
  assert.throws(() =>
    validateCampaignForm({
      ...form,
      questions: [{ ...form.questions[0], options: '잘못된 형식' }],
    }),
  )
})

test('실제 계약의 서울 현지 마감일을 PC 시간대와 무관하게 계산합니다', () => {
  const item = adaptCampaignSummary(
    {
      id: 9,
      title: '날짜 검수',
      startAt: '2026-10-17T00:00:00',
      endAt: '2026-10-21T23:59:00',
    },
    new Date('2026-10-16T15:00:00Z'),
  )
  assert.equal(item.daysLeft, 4)
  assert.equal(item.today, true)
})

test('카드도 달력과 동일하게 자정 종료의 직전 날짜를 사용합니다', () => {
  const item = adaptCampaignSummary(
    {
      id: 9,
      title: '자정 검수',
      startAt: '2026-10-17T00:00:00',
      endAt: '2026-10-21T00:00:00',
    },
    new Date('2026-10-17T01:00:00Z'),
  )
  assert.equal(item.daysLeft, 3)
})

// 새 필드가 없는 기존 서버 응답도 지원하며 다른 상품 사진을 가져오지 않습니다.
test('해당 캠페인의 대표 이미지가 있을 때만 카드 사진으로 사용합니다', () => {
  const dto = {
    id: 20,
    title: '대표 이미지 검수',
    representativeImageUrl: '/api/campaigns/20/media/representative/content',
  }
  assert.equal(adaptCampaignSummary(dto).image, dto.representativeImageUrl)
  for (const value of [undefined, null, '', '  ', 42]) {
    assert.equal(
      adaptCampaignSummary({ ...dto, representativeImageUrl: value }).image,
      null,
    )
  }
})
