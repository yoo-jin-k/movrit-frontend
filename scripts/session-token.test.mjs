import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  clearSession,
  readRefreshToken,
  refreshKey,
  saveLogin,
  storeRefreshed,
  tokenMemberId,
} from '../src/features/auth/sessionTokenModel.js'
import { saveOAuthSession } from '../src/features/auth/oauthSession.js'

const storage = (initial = {}) => {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    keys: () => [...data.keys()],
  }
}
// 서명은 검사하지 않으므로 형식만 맞춘 점검용 토큰입니다.
const fakeToken = (sub) =>
  `h.${Buffer.from(JSON.stringify({ sub })).toString('base64url')}.s`

test('접근 토큰에서 회원 번호를 읽고, 형식이 다르면 null입니다', () => {
  assert.equal(tokenMemberId(fakeToken('12')), '12')
  assert.equal(tokenMemberId(fakeToken(7)), '7')
  for (const bad of [null, undefined, '', 'abc', 'a.%%%.c', 123])
    assert.equal(tokenMemberId(bad), null)
})

test('탭마다 다른 계정으로 로그인해도 각 탭은 자기 계정 갱신 토큰을 씁니다', () => {
  const shared = storage()
  const sellerTab = storage()
  const userTab = storage()
  saveLogin(fakeToken('10'), 'seller-refresh', sellerTab, shared)
  saveLogin(fakeToken('20'), 'user-refresh', userTab, shared)
  assert.equal(readRefreshToken(sellerTab, shared), 'seller-refresh')
  assert.equal(readRefreshToken(userTab, shared), 'user-refresh')
})

test('같은 계정 탭들은 갱신으로 바뀐 최신 토큰을 함께 씁니다', () => {
  const shared = storage()
  const tabA = storage()
  saveLogin(fakeToken('10'), 'r1', tabA, shared)
  const tabB = storage({ accessToken: fakeToken('10') })
  assert.equal(
    storeRefreshed(
      '10',
      { accessToken: fakeToken('10'), refreshToken: 'r2' },
      tabA,
      shared,
    ),
    true,
  )
  assert.equal(readRefreshToken(tabB, shared), 'r2')
})

test('예전 공용 키로 갱신한 결과가 다른 계정이면 이 탭에 적용하지 않습니다', () => {
  const shared = storage({ refreshToken: 'legacy-of-20' }) // secret-check: allow (가짜 점검 값)
  const sellerTab = storage({ accessToken: fakeToken('10') })
  assert.equal(readRefreshToken(sellerTab, shared), 'legacy-of-20')
  const applied = storeRefreshed(
    '10',
    { accessToken: fakeToken('20'), refreshToken: 'rotated-20' }, // secret-check: allow (가짜 점검 값)
    sellerTab,
    shared,
  )
  assert.equal(applied, false)
  assert.equal(tokenMemberId(sellerTab.getItem('accessToken')), '10')
  // 회전된 토큰은 주인 계정 키로 보존되고 예전 공용 키는 정리됩니다.
  assert.equal(shared.getItem(refreshKey('20')), 'rotated-20')
  assert.equal(shared.getItem('refreshToken'), null)
})

test('로그아웃은 이 탭 계정만 지우고 다른 계정 탭은 남깁니다', () => {
  const shared = storage()
  const sellerTab = storage()
  const userTab = storage()
  saveLogin(fakeToken('10'), 'seller-refresh', sellerTab, shared)
  saveLogin(fakeToken('20'), 'user-refresh', userTab, shared)
  clearSession(sellerTab, shared)
  assert.equal(sellerTab.getItem('accessToken'), null)
  assert.equal(shared.getItem(refreshKey('10')), null)
  assert.equal(readRefreshToken(userTab, shared), 'user-refresh')
})

test('소셜 로그인은 같은 계정의 예전 갱신 토큰만 지우고 다른 계정은 남깁니다', () => {
  const session = storage()
  const local = storage({
    refreshToken: 'legacy', // secret-check: allow (가짜 점검 값)
    [refreshKey('30')]: 'stale-30',
    [refreshKey('10')]: 'other-10',
  })
  assert.equal(saveOAuthSession(fakeToken('30'), session, local), true)
  assert.equal(tokenMemberId(session.getItem('accessToken')), '30')
  assert.equal(local.getItem(refreshKey('30')), null)
  assert.equal(local.getItem('refreshToken'), null)
  assert.equal(local.getItem(refreshKey('10')), 'other-10')
})
