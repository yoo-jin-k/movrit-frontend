// 운영자 캠페인 관리(숨기기·다시 공개), 비밀번호 찾기·재설정, 찜한 프리오더 메뉴 숨김, 모바일 메시지 탭을 실제 화면으로 확인합니다.
// 비밀번호 재설정 점검 계정(demo-user)은 점검 뒤 원래 비밀번호로 되돌립니다(되돌리기는 qa/e2e 밖의 운영 스크립트가 맡습니다).
import {
  api,
  base,
  call,
  login,
  openBrowser,
  pageAs,
  temporaryPassword,
} from './e2e-lib.mjs'

const admin = await login('demo-admin@movrit.local')
const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`)
}
const browser = await openBrowser()
const publicIds = async () =>
  (await (await fetch(`${api}/collaborations/campaigns/open`)).json()).map(
    (c) => c.id,
  )

// 1) 운영자 캠페인 관리: 목록·필터·숨기기(사유 필수)·다시 공개
const ap = await pageAs(browser, admin)
await ap.goto(`${base}/admin/campaigns`, { waitUntil: 'networkidle' })
const total = (await call(admin, 'GET', '/admin/campaigns')).data
check('운영자 캠페인 목록', total.length > 0, `${total.length}개`)
const target = Number(process.env.TARGET || 13)
await ap.getByLabel('캠페인 검색').fill(String(target))
const row = ap.locator('tr', { hasText: `#${target}` })
if ((await row.innerText()).includes('숨기기')) {
  await row.getByRole('button', { name: '숨기기' }).click()
  await ap.getByLabel(/숨김 사유/).fill('')
  await ap.getByRole('button', { name: '숨기기 확정' }).click()
  check(
    '사유 없이 숨기기는 막힘',
    (await ap.locator('[role=alert]').innerText()).includes('사유'),
  )
  await ap.getByLabel(/숨김 사유/).fill('점검용 캠페인 정리')
  await ap.getByRole('button', { name: '숨기기 확정' }).click()
  await ap.waitForTimeout(1500)
}
check(
  '숨긴 캠페인은 사용자 목록에서 빠짐',
  !(await publicIds()).includes(target),
)
await ap.screenshot({ path: './e2e/admin_campaigns.png', fullPage: true })
await row.getByRole('button', { name: '다시 공개' }).click()
await ap.waitForTimeout(1500)
check(
  '다시 공개하면 사용자 목록에 돌아옴',
  (await publicIds()).includes(target),
)
const again = await call(admin, 'PATCH', `/admin/campaigns/${target}/close`, {
  reason: '점검용 캠페인 정리',
})
check('다시 숨김(정리 상태 유지)', again.status === 200, String(again.status))

// 2) 비밀번호 찾기 → 로컬 시연 모드 재설정 → 새 비밀번호 로그인
// 새 비밀번호는 실행할 때마다 무작위로 만듭니다(저장소에 남기지 않음).
const resetPassword = temporaryPassword()
const guest = await pageAs(browser, null)
await guest.goto(`${base}/password/forgot`, { waitUntil: 'networkidle' })
await guest.getByLabel('이메일').fill('demo-user@movrit.local')
await guest.getByRole('button', { name: '재설정 메일 받기' }).click()
await guest.getByRole('button', { name: '비밀번호 재설정하기' }).click()
await guest.waitForURL(/\/password\/reset\?token=/)
const resetUrl = guest.url()
await guest.getByLabel('새 비밀번호', { exact: true }).fill(resetPassword)
await guest.getByLabel('새 비밀번호 확인').fill(resetPassword)
await guest.getByRole('button', { name: '비밀번호 변경' }).click()
await guest
  .getByText('비밀번호를 바꿨습니다')
  .first()
  .waitFor({ timeout: 10000 })
const relogin = await fetch(`${api}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'demo-user@movrit.local',
    password: resetPassword,
  }),
})
check('재설정한 비밀번호로 로그인', relogin.ok, String(relogin.status))
await guest.goto(resetUrl, { waitUntil: 'networkidle' })
check(
  '한 번 쓴 링크는 다시 쓸 수 없음',
  (await guest.locator('main').innerText()).includes('사용할 수 없는 링크'),
)
const unknown = await (
  await fetch(`${api}/auth/password/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nobody-x@movrit.local' }),
  })
).json()
check(
  '없는 이메일도 같은 안내(가입 여부 비노출)',
  !unknown.devResetToken && unknown.message.includes('가입된 이메일이라면'),
)

// 3) 찜한 프리오더 메뉴 숨김·주소 이동, 모바일 메시지 탭
const user = await login('demo-creator@movrit.local')
const up = await pageAs(browser, user)
await up.goto(`${base}/mypage`, { waitUntil: 'networkidle' })
check(
  '마이페이지에 찜한 프리오더 메뉴 없음',
  !(await up.locator('main').innerText()).includes('찜한 프리오더'),
)
await up.goto(`${base}/favorites/preorders`, { waitUntil: 'networkidle' })
check(
  '예전 주소는 찜한 캠페인으로 이동',
  new URL(up.url()).pathname === '/favorites',
)
await up.setViewportSize({ width: 390, height: 800 })
await up.goto(`${base}/home`, { waitUntil: 'networkidle' })
const tabs = await up.locator('.mobile-tabbar a').allInnerTexts()
check(
  '모바일 하단 탭에 메시지',
  tabs.some((t) => t.includes('메시지')),
  tabs.map((t) => t.split('\n')[0]).join(' · '),
)
await up.screenshot({ path: './e2e/mobile_tabbar.png' })

console.log('페이지 오류:', ap.errors, guest.errors, up.errors)
await browser.close()
console.log(`\n결과: ${results.filter(Boolean).length}/${results.length} 통과`)
