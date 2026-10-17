import { test } from 'node:test'
import assert from 'node:assert/strict'
import { saveOAuthSession } from '../src/features/auth/oauthSession.js'
const storage = (initial) => {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  }
}
test('소셜 계정 로그인 후 이전 계정의 갱신 토큰으로 되돌아가지 않습니다', () => {
  const session = storage({ accessToken: 'previous-test-access' })
  const local = storage({
    refreshToken: 'previous-test-refresh',
    theme: 'light',
  })
  assert.equal(saveOAuthSession('new-test-access', session, local), true)
  assert.equal(session.getItem('accessToken'), 'new-test-access')
  assert.equal(local.getItem('refreshToken'), null)
  assert.equal(local.getItem('theme'), 'light')
})
test('실패한 콜백은 성공 세션으로 저장하지 않습니다', () => {
  const session = storage({}),
    local = storage({})
  for (const token of [null, undefined, '', ' '])
    assert.equal(saveOAuthSession(token, session, local), false)
  assert.equal(session.getItem('accessToken'), null)
})
