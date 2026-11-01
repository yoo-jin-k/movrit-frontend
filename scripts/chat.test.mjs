// 채팅 입력 검사, 새 메시지 합치기, 시각 표시를 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  chatInputError,
  chatTime,
  mergeMessages,
  roomTypeLabel,
} from '../src/features/chat/chatModel.js'

test('빈 메시지와 2,000자를 넘는 메시지는 막습니다', () => {
  assert.match(chatInputError('   '), /입력/)
  assert.match(chatInputError('가'.repeat(2001)), /2,000자/)
  assert.equal(chatInputError('안녕하세요'), '')
})

test('보내기 응답과 새 메시지 확인이 겹쳐도 한 번만 보여줍니다', () => {
  const merged = mergeMessages(
    [{ id: 1 }, { id: 3 }],
    [{ id: 3 }, { id: 2 }, { id: 4 }],
  )
  assert.deepEqual(
    merged.map((m) => m.id),
    [1, 2, 3, 4],
  )
})

test('오늘 메시지는 시각만, 다른 날은 날짜와 함께 보여줍니다', () => {
  const now = new Date('2026-11-02T10:00:00+09:00')
  assert.doesNotMatch(chatTime('2026-11-02T09:05:00+09:00', now), /\//)
  assert.match(chatTime('2026-10-30T09:05:00+09:00', now), /^10\/30 /)
  assert.equal(chatTime(null, now), '')
  assert.equal(roomTypeLabel('SUPPORT'), '운영자 문의')
})
