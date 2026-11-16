// 업체 참여자 관리의 완료 후 별점·메모 노출 규칙을 확인합니다.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  participantDetailLabel,
  ratingAvailability,
  ratingChoiceLabel,
} from '../src/features/business/participantRatingModel.js'

test('완료 참여만 별점·메모를 입력할 수 있습니다', () => {
  assert.equal(ratingAvailability('COMPLETED').editable, true)
  assert.equal(ratingAvailability('ACTIVE').editable, false)
  assert.equal(ratingAvailability('CANCELLED').editable, false)
})

test('완료 전에는 언제 남길 수 있는지 안내합니다', () => {
  assert.match(ratingAvailability('ACTIVE').hint, /완료된 뒤/)
  assert.match(ratingAvailability('CONTENT_SUBMITTED').hint, /완료된 뒤/)
  assert.match(ratingAvailability('REJECTED').hint, /완료된 참여에만/)
})

test('목록 버튼과 고른 별점을 글로 알려 줍니다', () => {
  assert.equal(participantDetailLabel('COMPLETED'), '상세 · 별점')
  assert.equal(participantDetailLabel('ACTIVE'), '상세 보기')
  assert.equal(ratingChoiceLabel(4), '4점 선택')
  assert.equal(ratingChoiceLabel(0), '별점을 골라 주세요')
})
