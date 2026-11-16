import test from 'node:test'
import assert from 'node:assert/strict'
import {
  mergeMessages,
  pollAfterId,
  unseenMessages,
} from '../src/features/chat/chatModel.js'

const ids = (...list) => list.map((id) => ({ id }))

test('새 메시지 확인은 끝에서 몇 개 앞부터 겹쳐 받습니다', () => {
  assert.equal(pollAfterId(ids(1, 2, 3, 4, 5, 6, 7, 8), 5), 3)
  assert.equal(pollAfterId(ids(8, 1, 7, 2, 6, 3, 5, 4), 5), 3)
  assert.equal(pollAfterId(ids(1, 2, 3), 5), null)
  assert.equal(pollAfterId([], 5), null)
  assert.equal(pollAfterId(null), null)
})

test('늦게 저장된 앞 번호 메시지도 다음 확인에서 받아 합칩니다', () => {
  // 내 메시지(101)가 먼저 보였고, 상대 메시지(100)는 늦게 저장된 상황입니다.
  const shown = ids(90, 91, 92, 93, 94, 95, 101)
  const after = pollAfterId(shown, 5)
  assert.ok(after < 100)
  const fromServer = ids(92, 93, 94, 95, 100, 101)
  const fresh = unseenMessages(shown, fromServer)
  assert.deepEqual(
    fresh.map((m) => m.id),
    [100],
  )
  assert.deepEqual(
    mergeMessages(shown, fromServer).map((m) => m.id),
    [90, 91, 92, 93, 94, 95, 100, 101],
  )
})

test('겹쳐 받은 메시지만 있으면 새 메시지로 보지 않습니다', () => {
  assert.deepEqual(unseenMessages(ids(1, 2, 3), ids(2, 3)), [])
  assert.deepEqual(unseenMessages(ids(1), null), [])
})
