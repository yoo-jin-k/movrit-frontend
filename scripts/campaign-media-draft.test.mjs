import test from 'node:test'
import assert from 'node:assert/strict'
import {
  emptyCampaignMediaDraft,
  appendDetailImage,
  moveDetailImage,
  removeDetailImage,
  updateDetailAltText,
  previewVisitLocation,
} from '../src/features/sellerCampaigns/campaignMediaDraft.js'
test('상세 이미지는 5장 경계와 중복을 검사한다', () => {
  let draft = emptyCampaignMediaDraft()
  for (let i = 0; i < 5; i++)
    draft = appendDetailImage(draft, { key: `image-${i}`, status: 'pending' })
  assert.throws(() => appendDetailImage(draft, { key: 'extra' }))
  assert.throws(() => appendDetailImage(emptyCampaignMediaDraft(), {}))
  assert.equal(removeDetailImage(draft, 'image-2').details.length, 4)
  assert.equal(draft.details.length, 5)
})
test('순서 이동이 원본 배열이나 설명을 바꾸지 않는다', () => {
  const draft = {
    ...emptyCampaignMediaDraft(),
    details: [
      { key: 'a', altText: '설명 A' },
      { key: 'b', altText: '설명 B' },
    ],
  }
  assert.deepEqual(moveDetailImage(draft, 'b', -1).details, [
    draft.details[1],
    draft.details[0],
  ])
  assert.equal(moveDetailImage(draft, 'a', -1), draft)
  assert.equal(draft.details[0].key, 'a')
  assert.throws(() => updateDetailAltText(draft, 'a', '가'.repeat(201)))
  assert.equal(
    updateDetailAltText(draft, 'a', '수정').details[1].altText,
    '설명 B',
  )
})
test('배송 전용에서는 주소를 공개하지 않고 보존하며 방문 재확인이 필요하다', () => {
  const location = { venueName: '매장', address1: '공개 주소' }
  const draft = {
    ...emptyCampaignMediaDraft(),
    location,
    locationConfirmed: true,
  }
  assert.equal(previewVisitLocation(draft, ['DELIVERY']), null)
  assert.equal(draft.location, location)
  assert.equal(
    previewVisitLocation({ ...draft, locationConfirmed: false }, ['VISIT']),
    null,
  )
  assert.equal(previewVisitLocation(draft, ['VISIT']), location)
})

test('이미지 설명은 UTF-16 길이가 아닌 code point 200자 경계를 적용한다', () => {
  const draft = {
    ...emptyCampaignMediaDraft(),
    details: [{ key: 'a', altText: '' }],
  }
  assert.equal(
    updateDetailAltText(draft, 'a', '😀'.repeat(200)).details[0].altText,
    '😀'.repeat(200),
  )
  assert.throws(() => updateDetailAltText(draft, 'a', '😀'.repeat(201)))
  assert.equal(
    updateDetailAltText(draft, 'a', '가😀'.repeat(100)).details[0].altText,
    '가😀'.repeat(100),
  )
})
