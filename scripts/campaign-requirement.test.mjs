import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  emptyRequirement,
  requirementForm,
  requirementPayload,
  validateRequirement,
} from '../src/features/sellerCampaigns/requirementModel.js'
test('조건 없음에 숨은 기본 최소값을 부여하지 않습니다', () => {
  assert.equal(emptyRequirement().minimumValue, '')
  assert.equal(requirementPayload(emptyRequirement()), null)
})
test('브랜드의 임의 최소값을 캠페인별로 유지합니다', () => {
  for (const number of [0, 123, 500, 1000])
    assert.equal(
      requirementPayload({
        ...emptyRequirement(),
        mode: 'CONDITION',
        minimumValue: String(number),
      }).minimumValue,
      number,
    )
  for (const number of ['', '-1', '1.5', '1e3', '9007199254740992'])
    assert.throws(() =>
      requirementPayload({
        ...emptyRequirement(),
        mode: 'CONDITION',
        minimumValue: number,
      }),
    )
})
test('미지원 채널·기간·등급을 동작 가능한 조건으로 저장하지 않습니다', () => {
  for (const override of [
    { channelType: 'NAVER_BLOG' },
    { metricType: 'RANK' },
    { measurementPeriod: 'MONTHLY' },
  ])
    assert.throws(() =>
      requirementPayload({
        ...emptyRequirement(),
        mode: 'CONDITION',
        minimumValue: '123',
        ...override,
      }),
    )
})
test('재조회한 값과 버전을 보존하고 다른 캠페인 응답은 거부합니다', () => {
  const data = {
    id: 1,
    campaignId: 13,
    channelType: 'INSTAGRAM',
    metricType: 'FOLLOWER_COUNT',
    minimumValue: 123,
    measurementPeriod: null,
    version: 2,
  }
  assert.equal(
    requirementForm(validateRequirement(data, 13)).minimumValue,
    '123',
  )
  assert.equal(requirementForm(data).version, 2)
  assert.throws(() => validateRequirement(data, 14))
  assert.equal(requirementForm(null).mode, 'NONE')
})

test('수정 시 숨겨진 기존 캠페인 필드와 일정 버전을 보존합니다', async () => {
  const { configuredCampaignPayload } = await import(
    '../src/features/sellerCampaigns/campaignEditorModel.js'
  )
  const form = {
    preorderId: '4',
    title: '캠페인',
    description: '소개',
    category: '뷰티',
    recruitmentCount: '2',
    rewardDescription: '혜택',
    startAt: '2026-11-01T09:00',
    endAt: '2026-11-30T18:00',
  }
  const condition = {
    ...emptyRequirement(),
    mode: 'CONDITION',
    minimumValue: '123',
    version: 4,
  }
  const original = {
    scheduleVersion: 2,
    minFollowerCount: 777,
    mission: '기존미션',
    deliveryGuide: '기존배송안내',
    selectionAnnouncedAt: '2026-12-01T10:00',
  }
  const update = configuredCampaignPayload(form, condition, original)
  assert.equal(update.requirement.minimumValue, 123)
  assert.equal(update.requirement.expectedVersion, 4)
  assert.equal(update.campaign.mission, '기존미션')
  assert.equal(update.campaign.deliveryGuide, '기존배송안내')
  assert.equal(update.campaign.expectedScheduleVersion, 2)
  assert.equal(
    update.campaign.selectionAnnouncedAt,
    original.selectionAnnouncedAt,
  )
  const removed = configuredCampaignPayload(
    form,
    { ...condition, mode: 'NONE' },
    original,
  )
  assert.equal(removed.requirement, null)
  assert.equal(removed.expectedRequirementVersion, 4)
  const created = configuredCampaignPayload(form, emptyRequirement())
  assert.equal(created.requirementMode, 'NONE')
  assert.equal(created.requirement, null)
})

test('새 캠페인은 프리오더 없이 운영 브랜드만으로 만들 수 있습니다', async () => {
  const { configuredCampaignPayload, emptyCampaign } = await import(
    '../src/features/sellerCampaigns/campaignEditorModel.js'
  )
  const form = {
    ...emptyCampaign(),
    brandId: '5',
    title: '브랜드 단독 체험단',
    recruitmentCount: '3',
    startAt: '2026-11-01T09:00',
    endAt: '2026-11-30T18:00',
  }
  const payload = configuredCampaignPayload(form, emptyRequirement())
  assert.equal(payload.campaign.brandId, 5)
  assert.equal(payload.campaign.preorderId, null)
  // 브랜드도 비워 두면 서버가 운영 브랜드를 정하도록 null로 보냅니다.
  const auto = configuredCampaignPayload(
    { ...form, brandId: '' },
    emptyRequirement(),
  )
  assert.equal(auto.campaign.brandId, null)
  assert.throws(() =>
    configuredCampaignPayload(
      { ...form, preorderId: 'abc' },
      emptyRequirement(),
    ),
  )
})

test('캠페인 종류·지역·채널을 보내고 지역 캠페인은 지역을 요구합니다', async () => {
  const { configuredCampaignPayload, emptyCampaign } = await import(
    '../src/features/sellerCampaigns/campaignEditorModel.js'
  )
  const form = {
    ...emptyCampaign(),
    title: '성수 카페 방문 체험',
    recruitmentCount: '3',
    startAt: '2026-11-01T09:00',
    endAt: '2026-11-30T18:00',
  }
  const product = configuredCampaignPayload(
    { ...form, region: '서울' },
    emptyRequirement(),
  )
  assert.equal(product.campaign.campaignType, 'PRODUCT')
  // 제품 캠페인은 지역을 보내지 않습니다.
  assert.equal(product.campaign.region, null)
  assert.equal(product.campaign.contentChannel, null)
  assert.throws(
    () =>
      configuredCampaignPayload(
        { ...form, campaignType: 'LOCAL' },
        emptyRequirement(),
      ),
    /방문 지역/,
  )
  const local = configuredCampaignPayload(
    {
      ...form,
      campaignType: 'LOCAL',
      region: '서울',
      contentChannel: 'INSTAGRAM',
    },
    emptyRequirement(),
  )
  assert.equal(local.campaign.region, '서울')
  assert.equal(local.campaign.contentChannel, 'INSTAGRAM')
})
