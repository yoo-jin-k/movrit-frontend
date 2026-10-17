import test from 'node:test'
import assert from 'node:assert/strict'
import { readCampaignDetailImages } from '../src/features/sellerCampaigns/campaignPresentationAdapter.js'
const image = (id, displayOrder) => ({
  id,
  displayOrder,
  imageUrl: `/uploads/${id}.webp`,
  altText: null,
})
test('실제 DTO 순서를 복원하며 행 ID를 자산 ID로 취급하지 않는다', () => {
  const input = { detailImages: [image(8, 1), image(7, 0)] }
  const result = readCampaignDetailImages(input)
  assert.deepEqual(
    result.map((i) => i.detailImageId),
    [7, 8],
  )
  assert.equal(result[0].altText, '')
  assert.equal('assetId' in result[0], false)
  assert.equal(input.detailImages[0].id, 8)
})
test('불완전하거나 중복된 목록을 빈 목록으로 대체하지 않는다', () => {
  for (const detailImages of [
    null,
    [image(1, 0), image(1, 1)],
    [image(1, 0), image(2, 0)],
    [image(1, 1)],
    Array.from({ length: 6 }, (_, i) => image(i + 1, i)),
  ])
    assert.throws(() => readCampaignDetailImages({ detailImages }))
  assert.deepEqual(readCampaignDetailImages({ detailImages: [] }), [])
})
