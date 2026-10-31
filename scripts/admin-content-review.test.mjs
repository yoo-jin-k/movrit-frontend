import test from 'node:test'
import assert from 'node:assert/strict'
import {
  canOperatorReview,
  filterSubmissions,
  reviewPayload,
} from '../src/features/admin/contentReviewModel.js'

test('운영자는 검토 대기·업체 검토 완료 콘텐츠만 처리할 수 있습니다', () => {
  assert.equal(canOperatorReview({ status: 'BRAND_APPROVED' }), true)
  assert.equal(canOperatorReview({ status: 'SUBMITTED' }), true)
  assert.equal(canOperatorReview({ status: 'APPROVED' }), false)
  assert.equal(canOperatorReview({ status: 'REVISION_REQUESTED' }), false)
})

test('상태와 검색어로 목록을 거릅니다', () => {
  const items = [
    {
      id: 1,
      applicationId: 10,
      status: 'BRAND_APPROVED',
      creatorNickname: '검수',
      campaignTitle: '세럼',
    },
    {
      id: 2,
      applicationId: 11,
      status: 'APPROVED',
      creatorNickname: '민지',
      campaignTitle: '크림',
    },
  ]
  assert.deepEqual(
    filterSubmissions(items, 'BRAND_APPROVED', '').map((x) => x.id),
    [1],
  )
  assert.deepEqual(
    filterSubmissions(items, '', '크림').map((x) => x.id),
    [2],
  )
})

test('수정 요청은 의견이 필요하고 버전을 함께 보냅니다', () => {
  const item = { id: 1, version: 3 }
  assert.deepEqual(reviewPayload('approve', item, '  '), {
    comment: null,
    expectedVersion: 3,
  })
  assert.throws(() => reviewPayload('request-revision', item, ' '), /의견/)
  assert.throws(() => reviewPayload('approve', { id: 1 }, ''), /최신 목록/)
})
