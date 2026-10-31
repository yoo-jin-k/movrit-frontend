// 지연 로딩 전환 후 모든 경로가 오류 없이 그려지는지 확인합니다.
// 역할별(비회원·사용자·업체·운영자)로 로그인한 뒤 경로를 열고, 페이지 오류·로딩 멈춤·빈 화면을 기록합니다.
import { base, login, openBrowser, pageAs } from './e2e-lib.mjs'

const ROUTES = {
  guest: [
    '/home',
    '/login',
    '/signup',
    '/category/제품',
    '/campaign/44',
    '/special/clip',
    '/offerwall',
    '/community/free',
    '/notices',
    '/support',
    '/password/forgot',
    '/nope-404',
  ],
  user: [
    '/mypage',
    '/mypage/campaigns',
    '/mypage/contents',
    '/settings',
    '/settings/security',
    '/settings/terms',
    '/settings/withdraw',
    '/favorites',
    '/favorites/preorders',
    '/preorders',
    '/orders',
    '/mypage/profile',
    '/mypage/addresses',
    '/mypage/payments',
    '/mypage/notifications',
    '/preorders/status/open',
    '/notifications',
    '/inquiries',
    '/creator/apply',
    '/creator/dashboard',
    '/creator/profile',
    '/creator/collaborations',
    '/seller/apply',
    '/roles',
  ],
  brand: [
    '/seller/dashboard',
    '/seller/campaigns',
    '/seller/campaigns/new',
    '/seller/campaigns/44',
    '/seller/participants',
    '/seller/contents',
    '/seller/inbox',
    '/seller/settings',
    '/seller/brands',
    '/seller/products',
    '/seller/preorders',
    '/seller/operations',
    '/seller/collaborations',
  ],
  admin: [
    '/admin/dashboard',
    '/admin/campaign-participants',
    '/admin/sellers',
    '/admin/members',
    '/admin/creators',
    '/admin/preorders',
    '/admin/refunds',
    '/admin/collaborations',
    '/admin/settlements',
    '/admin/content',
    '/admin/inquiries',
    '/admin/reports',
    '/admin/settings',
  ],
}
const ACCOUNTS = {
  user: 'claude-design-user@movrit.local',
  brand: 'claude-design-brand@movrit.local',
  admin: 'claude-e2e-admin@movrit.local',
}
const browser = await openBrowser()
let problems = 0
for (const [role, routes] of Object.entries(ROUTES)) {
  const auth = role === 'guest' ? null : await login(ACCOUNTS[role])
  const page = await pageAs(browser, auth)
  for (const route of routes) {
    page.errors.length = 0
    await page.goto(base + route, { waitUntil: 'networkidle' }).catch(() => {})
    await page.waitForTimeout(300)
    const text = (
      await page
        .locator('body')
        .innerText()
        .catch(() => '')
    ).trim()
    const stuck = text.includes('화면을 불러오고 있습니다')
    const empty = text.length < 20
    const bad = page.errors.length || stuck || empty
    if (bad) problems++
    console.log(
      `${bad ? '✗' : '✓'} [${role}] ${route} → ${decodeURI(new URL(page.url()).pathname)}${page.errors.length ? ' 오류: ' + page.errors.join(' | ').slice(0, 200) : ''}${stuck ? ' (로딩 멈춤)' : ''}${empty ? ' (빈 화면)' : ''}`,
    )
  }
}
console.log(`문제 경로 수: ${problems}`)
await browser.close()
