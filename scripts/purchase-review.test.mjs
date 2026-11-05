// 구매평 캠페인 화면 규칙(참여 방식, 구매 안내·구매 인증 확인, 환급 기록 조건)을 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  canRecordPayback,
  sellerPaybackLabel,
  fulfillmentForType,
  fulfillmentLabel,
  fulfillmentOptions,
  purchaseInfoError,
  purchaseInfoRequest,
  purchaseProofError,
  won,
} from '../src/features/purchaseReview/purchaseReviewModel.js'
import { applicationFormRequest } from '../src/features/sellerCampaigns/applicationFormModel.js'
import { myParticipationAction } from '../src/features/membership/myContentModel.js'
import { adaptCampaignSummary } from '../src/features/discovery/campaignReadAdapter.js'

const info = {
  storeName: '네이버 스마트스토어',
  productUrl: 'https://smartstore.naver.com/movrit/1',
  productPrice: '19900',
  paybackAmount: '15000',
  purchaseGuide: '',
}

test('구매평은 직접 구매만, 다른 종류는 배송·방문', () => {
  assert.deepEqual(fulfillmentOptions('PURCHASE_REVIEW'), ['PURCHASE'])
  assert.deepEqual(fulfillmentOptions('PRODUCT'), ['DELIVERY', 'VISIT'])
  assert.deepEqual(fulfillmentForType('PURCHASE_REVIEW', ['DELIVERY']), [
    'PURCHASE',
  ])
  assert.deepEqual(fulfillmentForType('LOCAL', ['PURCHASE']), [])
  assert.deepEqual(fulfillmentForType('LOCAL', ['VISIT', 'PURCHASE']), [
    'VISIT',
  ])
  assert.equal(fulfillmentLabel('PURCHASE'), '직접 구매')
  assert.deepEqual(
    applicationFormRequest({
      allowedFulfillmentTypes: ['PURCHASE'],
      questions: [],
      agreements: [],
    }).allowedFulfillmentTypes,
    ['PURCHASE'],
  )
})

test('구매 안내 확인', () => {
  assert.equal(purchaseInfoError(info), '')
  assert.match(purchaseInfoError({ ...info, storeName: ' ' }), /구매처/)
  assert.match(
    purchaseInfoError({ ...info, productUrl: 'javascript:alert(1)' }),
    /http/,
  )
  assert.match(
    purchaseInfoError({ ...info, paybackAmount: '20000' }),
    /클 수 없/,
  )
  assert.match(purchaseInfoError({ ...info, productPrice: '1.5' }), /숫자/)
  assert.deepEqual(purchaseInfoRequest(info), {
    storeName: '네이버 스마트스토어',
    productUrl: 'https://smartstore.naver.com/movrit/1',
    productPrice: 19900,
    paybackAmount: 15000,
    purchaseGuide: null,
  })
  assert.equal(won(19900), '19,900원')
})

test('구매 인증 확인', () => {
  const file = { type: 'image/png', size: 1000 }
  assert.equal(
    purchaseProofError({ orderNumber: 'A-1', paidAmount: '19900', file }),
    '',
  )
  assert.match(purchaseProofError({ paidAmount: '1', file }), /주문번호/)
  assert.match(
    purchaseProofError({ orderNumber: 'A', paidAmount: '', file }),
    /금액/,
  )
  assert.match(
    purchaseProofError({ orderNumber: 'A', paidAmount: '1' }),
    /캡처/,
  )
  assert.match(
    purchaseProofError({
      orderNumber: 'A',
      paidAmount: '1',
      file: { type: 'application/pdf', size: 1 },
    }),
    /JPG/,
  )
})

test('구매평 신청은 체험 완료 확인 대신 구매 인증, 환급은 완료 후 한 번', () => {
  assert.equal(
    myParticipationAction({ status: 'ACTIVE', fulfillmentType: 'PURCHASE' }),
    null,
  )
  assert.equal(
    myParticipationAction({ status: 'ACTIVE', fulfillmentType: 'DELIVERY' }),
    'experience-confirm',
  )
  const pending = { paybackStatus: 'PENDING' }
  assert.equal(canRecordPayback({ status: 'COMPLETED' }, pending), true)
  assert.equal(
    canRecordPayback({ status: 'CONTENT_SUBMITTED' }, pending),
    false,
  )
  assert.equal(
    canRecordPayback({ status: 'COMPLETED' }, { paybackStatus: 'PAID' }),
    false,
  )
  assert.equal(canRecordPayback({ status: 'COMPLETED' }, null), false)
})

test('구매평 캠페인은 구매평 메뉴에 표시', () => {
  const card = adaptCampaignSummary({
    id: 1,
    title: '구매평',
    campaignType: 'PURCHASE_REVIEW',
  })
  assert.equal(card.kind, '구매평')
  assert.equal(card.shoppingreview, true)
  assert.equal(
    adaptCampaignSummary({ id: 2, title: '제품', campaignType: 'PRODUCT' })
      .shoppingreview,
    false,
  )
})

test('업체 화면 환급 상태: 완료된 신청의 미환급은 목록과 같이 환급 가능으로 표시합니다', () => {
  const pending = { paybackStatus: 'PENDING' }
  assert.equal(
    sellerPaybackLabel({ status: 'COMPLETED' }, pending),
    '환급 가능',
  )
  assert.equal(
    sellerPaybackLabel({ status: 'CONTENT_SUBMITTED' }, pending),
    '환급 대기',
  )
  assert.equal(
    sellerPaybackLabel({ status: 'COMPLETED' }, { paybackStatus: 'PAID' }),
    '환급 완료',
  )
})
