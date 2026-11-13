// 캠페인 등록 화면의 참여 방식(배송형·방문형 택1)과 방문 입력 숨김·저장 규칙을 확인합니다.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  applicationFormRequest,
  chooseFulfillment,
  emptyApplicationForm,
  fulfillmentForCampaignType,
  hasMixedFulfillment,
  usesVisit,
  visitRemovalWarning,
} from '../src/features/sellerCampaigns/applicationFormModel.js'
import {
  configuredCampaignPayload,
  emptyCampaign,
} from '../src/features/sellerCampaigns/campaignEditorModel.js'
import { emptyRequirement } from '../src/features/sellerCampaigns/requirementModel.js'

test('참여 방식은 하나만 고르고, 다른 방식을 고르면 바뀝니다', () => {
  const visit = chooseFulfillment(emptyApplicationForm(), 'VISIT')
  assert.deepEqual(visit.allowedFulfillmentTypes, ['VISIT'])
  assert.deepEqual(
    chooseFulfillment(visit, 'DELIVERY').allowedFulfillmentTypes,
    ['DELIVERY'],
  )
})

test('배송형·방문형을 함께 고른 신청서는 저장 전에 막습니다', () => {
  const mixed = {
    ...emptyApplicationForm(),
    allowedFulfillmentTypes: ['DELIVERY', 'VISIT'],
  }
  assert.equal(hasMixedFulfillment(mixed.allowedFulfillmentTypes), true)
  assert.throws(() => applicationFormRequest(mixed), /하나만/)
  assert.deepEqual(
    applicationFormRequest({
      ...emptyApplicationForm(),
      allowedFulfillmentTypes: ['DELIVERY'],
    }).allowedFulfillmentTypes,
    ['DELIVERY'],
  )
})

test('캠페인 종류를 바꾸면 어울리는 참여 방식 하나로 맞춥니다', () => {
  assert.deepEqual(fulfillmentForCampaignType('LOCAL', ['DELIVERY']), ['VISIT'])
  assert.deepEqual(fulfillmentForCampaignType('PRODUCT', ['VISIT']), [
    'DELIVERY',
  ])
  assert.deepEqual(fulfillmentForCampaignType('PURCHASE_REVIEW', ['VISIT']), [
    'PURCHASE',
  ])
  // 기자단은 고른 값 하나를 유지하고, 둘이거나 직접 구매면 비웁니다.
  assert.deepEqual(fulfillmentForCampaignType('REPORTER', ['VISIT']), ['VISIT'])
  assert.deepEqual(
    fulfillmentForCampaignType('REPORTER', ['DELIVERY', 'VISIT']),
    [],
  )
  assert.deepEqual(fulfillmentForCampaignType('REPORTER', ['PURCHASE']), [])
})

test('방문 입력은 방문형일 때만 씁니다', () => {
  assert.equal(usesVisit(['VISIT']), true)
  assert.equal(usesVisit(['DELIVERY']), false)
  assert.equal(usesVisit(undefined), false)
})

const form = {
  ...emptyCampaign(),
  title: '앰플 체험',
  recruitmentCount: '3',
  startAt: '2026-12-01T10:00',
  endAt: '2026-12-10T10:00',
  visitGuide: '평일 11시~20시 방문',
}

test('방문형이 아니면 숨긴 방문 안내를 저장 요청에 넣지 않습니다', () => {
  const created = configuredCampaignPayload(form, emptyRequirement(), null, {
    visit: false,
  })
  assert.equal(created.campaign.details.visitGuide, null)
  const visitCreated = configuredCampaignPayload(
    form,
    emptyRequirement(),
    null,
    {
      visit: true,
    },
  )
  assert.equal(visitCreated.campaign.details.visitGuide, '평일 11시~20시 방문')
  const original = { scheduleVersion: 2, visitGuide: '기존 안내' }
  const updated = configuredCampaignPayload(
    form,
    emptyRequirement(),
    original,
    { visit: false },
  )
  assert.equal(updated.campaign.visitGuide, null)
})

test('수정 중 방문형을 해제하면 기존 방문 정보가 지워진다고 알립니다', () => {
  assert.match(
    visitRemovalWarning({
      editing: true,
      savedTypes: ['VISIT'],
      currentTypes: ['DELIVERY'],
    }),
    /지워집니다/,
  )
  assert.match(
    visitRemovalWarning({
      editing: true,
      savedTypes: ['DELIVERY'],
      currentTypes: ['DELIVERY'],
      savedVisitGuide: '예전 방문 안내',
    }),
    /지워집니다/,
  )
  assert.equal(
    visitRemovalWarning({
      editing: true,
      savedTypes: ['VISIT'],
      currentTypes: ['VISIT'],
    }),
    '',
  )
  assert.equal(
    visitRemovalWarning({
      editing: false,
      savedTypes: [],
      currentTypes: ['DELIVERY'],
    }),
    '',
  )
})
