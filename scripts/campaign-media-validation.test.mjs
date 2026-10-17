import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CAMPAIGN_IMAGE_MAX_BYTES,
  validateCampaignImageFile,
  validateVisitLocationInput,
} from '../src/features/sellerCampaigns/campaignMediaValidation.js'
test('이미지의 0바이트·5MiB 경계와 형식을 확인한다', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp'])
    assert.equal(
      validateCampaignImageFile({ type, size: CAMPAIGN_IMAGE_MAX_BYTES }).size,
      CAMPAIGN_IMAGE_MAX_BYTES,
    )
  assert.throws(() => validateCampaignImageFile({ type: 'image/png', size: 0 }))
  assert.throws(() =>
    validateCampaignImageFile({
      type: 'image/png',
      size: CAMPAIGN_IMAGE_MAX_BYTES + 1,
    }),
  )
  assert.throws(() =>
    validateCampaignImageFile({ type: 'image/svg+xml', size: 100 }),
  )
})
test('방문 장소와 주소를 추론하지 않고 필수·길이·우편번호를 확인한다', () => {
  assert.throws(() =>
    validateVisitLocationInput({ visitGuide: '이전 방문 안내' }),
  )
  assert.throws(() =>
    validateVisitLocationInput({
      venueName: '매장',
      address1: '주소',
      postalCode: '1234',
    }),
  )
  assert.throws(() =>
    validateVisitLocationInput({
      venueName: '가'.repeat(101),
      address1: '주소',
    }),
  )
  assert.deepEqual(
    validateVisitLocationInput({
      venueName: ' 매장 ',
      address1: ' 공개 주소 ',
      postalCode: '01234',
    }),
    {
      venueName: '매장',
      address1: '공개 주소',
      postalCode: '01234',
      address2: '',
    },
  )
})
