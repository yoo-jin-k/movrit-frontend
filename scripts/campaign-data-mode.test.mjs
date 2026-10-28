import test from 'node:test'
import assert from 'node:assert/strict'
import { campaignPreviewEnabled } from '../src/features/discovery/campaignDataMode.js'

test('기본값과 live 및 미지원 값은 실제 서버 조회를 선택합니다', () => {
  for (const mode of [undefined, '', 'live', 'demo', 'PREVIEW']) {
    assert.equal(campaignPreviewEnabled({ dev: true, mode }), false)
  }
})
test('명시적 개발 preview만 예시이며 실제 목록 링크는 이를 해제합니다', () => {
  assert.equal(campaignPreviewEnabled({ dev: true, mode: 'preview' }), true)
  assert.equal(
    campaignPreviewEnabled({ dev: true, mode: 'preview', forceLive: true }),
    false,
  )
  assert.equal(campaignPreviewEnabled({ dev: false, mode: 'preview' }), false)
})
