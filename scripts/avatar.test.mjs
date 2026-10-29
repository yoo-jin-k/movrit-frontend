import test from 'node:test'
import assert from 'node:assert/strict'
import {
  avatarUrl,
  avatarFileError,
} from '../src/features/membership/avatarModel.js'
test('서버 사진 경로만 사용하고 외부URL과누락값을기본아바타로처리합니다', () => {
  assert.equal(
    avatarUrl('/api/members/1/avatar?v=abc-123'),
    '/api/members/1/avatar?v=abc-123',
  )
  for (const value of [
    null,
    'https://example.com/avatar.png',
    'javascript:alert(1)',
    '/api/members/../avatar?v=x',
    '//example.com/a',
  ])
    assert.equal(avatarUrl(value), null)
})
test('사진선택시허용형식과최대크기를검증합니다', () => {
  assert.equal(
    avatarFileError({ type: 'image/png', size: 5 * 1024 * 1024 }),
    '',
  )
  assert.match(
    avatarFileError({ type: 'image/png', size: 5 * 1024 * 1024 + 1 }),
    /5MiB/,
  )
  assert.match(avatarFileError({ type: 'image/svg+xml', size: 10 }), /JPEG/)
  assert.match(avatarFileError({ type: 'image/jpeg', size: 0 }), /5MiB/)
})
