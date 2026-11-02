// 채팅 영상·여러 파일 첨부, 입력 중 안내, 검색 강조를 확인합니다.
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  chatAttachmentError,
  chatFilesError,
  chatSearchError,
  highlightParts,
  isVideoAttachment,
  typingLabel,
} from '../src/features/chat/chatModel.js'

const MB = 1024 * 1024

test('영상은 20MB까지, 사진·PDF는 5MB까지', () => {
  assert.equal(chatAttachmentError({ type: 'video/mp4', size: 19 * MB }), '')
  assert.equal(chatAttachmentError({ type: 'video/quicktime', size: MB }), '')
  assert.match(
    chatAttachmentError({ type: 'video/mp4', size: 21 * MB }),
    /20MB/,
  )
  assert.match(chatAttachmentError({ type: 'image/png', size: 6 * MB }), /5MB/)
  assert.match(chatAttachmentError({ type: 'video/avi', size: MB }), /영상/)
  assert.equal(isVideoAttachment({ contentType: 'video/webm' }), true)
  assert.equal(isVideoAttachment({ contentType: 'image/png' }), false)
})

test('여러 파일은 10개까지, 맞지 않는 파일 이름을 알려 줌', () => {
  const ok = { name: 'a.png', type: 'image/png', size: 100 }
  assert.equal(chatFilesError([ok, ok]), '')
  assert.match(chatFilesError(Array(11).fill(ok)), /10개/)
  assert.match(
    chatFilesError([ok, { name: 'b.gif', type: 'image/gif', size: 1 }]),
    /^b\.gif:/,
  )
})

test('입력 중 안내 문구', () => {
  assert.equal(typingLabel([]), '')
  assert.equal(typingLabel(['브랜드A']), '브랜드A님이 입력 중')
  assert.equal(
    typingLabel(['운영자', '브랜드A', '운영자']),
    '운영자님 외 1명이 입력 중',
  )
})

test('검색어 확인과 강조 조각', () => {
  assert.match(chatSearchError('  '), /입력/)
  assert.match(chatSearchError('가'.repeat(51)), /50자/)
  assert.equal(chatSearchError('배송'), '')
  assert.deepEqual(highlightParts('배송 일정 Delivery', 'deliv'), [
    { text: '배송 일정 ', match: false },
    { text: 'Deliv', match: true },
    { text: 'ery', match: false },
  ])
  assert.deepEqual(highlightParts('abc', ''), [{ text: 'abc', match: false }])
})
