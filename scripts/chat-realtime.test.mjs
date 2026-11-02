// 채팅 첨부·읽음 표시·실시간 이벤트(SSE) 해석을 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  chatAttachmentError,
  fileSizeLabel,
  isReadByOthers,
} from '../src/features/chat/chatModel.js'
import { parseSseBlock } from '../src/features/chat/chatStream.js'

test('첨부는 사진·PDF 5MB까지, 크기 표시', () => {
  assert.equal(chatAttachmentError({ type: 'image/png', size: 100 }), '')
  assert.match(chatAttachmentError({ type: 'image/gif', size: 100 }), /PDF/)
  assert.match(
    chatAttachmentError({ type: 'application/pdf', size: 6 * 1024 * 1024 }),
    /5MB/,
  )
  assert.equal(fileSizeLabel(1536 * 1024), '1.5MB')
  assert.equal(fileSizeLabel(2048), '2KB')
})

test('읽음 표시는 내 메시지이고 상대 읽음 위치 이하일 때만', () => {
  assert.equal(isReadByOthers({ id: 5, mine: true }, 5), true)
  assert.equal(isReadByOthers({ id: 6, mine: true }, 5), false)
  assert.equal(isReadByOthers({ id: 3, mine: false }, 5), false)
})

test('SSE 블록을 이벤트로 나눕니다', () => {
  assert.deepEqual(
    parseSseBlock('event:message\ndata:{"roomId":3,"messageId":9}'),
    {
      type: 'message',
      data: { roomId: 3, messageId: 9 },
    },
  )
  assert.equal(parseSseBlock(':keep-alive'), null)
})
