// 업체 상세 창의 닫기 규칙(바깥 클릭 판정, 저장하지 않은 입력 확인)을 확인합니다.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  closeDecision,
  isOutsideRect,
} from '../src/features/business/dialogCloseModel.js'

test('입력이 없으면 바로 닫고, 저장하지 않은 입력이 있으면 확인을 거칩니다', () => {
  assert.equal(closeDecision({}), 'close')
  assert.equal(closeDecision({ unsaved: false }), 'close')
  assert.equal(closeDecision({ unsaved: true }), 'confirm')
})

test('처리 중에는 입력 여부와 상관없이 닫지 않습니다', () => {
  assert.equal(closeDecision({ busy: true }), 'blocked')
  assert.equal(closeDecision({ busy: true, unsaved: true }), 'blocked')
})

test('상세 창 사각형 바깥 좌표만 배경 클릭으로 봅니다', () => {
  const rect = { left: 800, right: 1360, top: 0, bottom: 900 }
  assert.equal(isOutsideRect(rect, 400, 300), true)
  assert.equal(isOutsideRect(rect, 1000, 300), false)
  assert.equal(isOutsideRect(rect, 800, 0), false)
  assert.equal(isOutsideRect(rect, 1000, 901), true)
  assert.equal(isOutsideRect(null, 10, 10), false)
})
