// README·포트폴리오용 화면 캡처를 만듭니다(docs/screenshots).
// 준비: 통합 서버·프론트 실행, seed-portfolio.mjs 로 시연 데이터 준비
// 실행: MOVRIT_QA_PASSWORD=... node qa/portfolio/capture-screens.mjs [이름 필터]
import fs from 'node:fs'
import { chromium } from 'playwright-core'
import { base, call, login } from '../e2e/e2e-lib.mjs'

const out = new URL('../../docs/screenshots/', import.meta.url).pathname
fs.mkdirSync(out, { recursive: true })
const only = process.argv[2]
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const auth = {
  studio: await login('lumi.studio@movrit.local'),
  haneul: await login('haneul@movrit.local'),
  minji: await login('minji@movrit.local'),
  admin: await login('demo-admin@movrit.local'),
}
const ids = Object.fromEntries(
  (await call(auth.studio, 'GET', '/collaborations/campaigns/seller')).data.map(
    (c) => [c.title, c.id],
  ),
)
const ampoule = ids['시카 수분 앰플 2주 사용 후기 체험단']
const coffee = ids['콜드브루 원두 구매평 캠페인']
const mist = ids['패브릭 미스트 공간 리뷰 체험단']
const haneulApp = (
  await call(auth.haneul, 'GET', '/campaigns/applications/mine')
).data.find((a) => a.campaignId === ampoule)
const room = (
  await call(auth.studio, 'POST', `/chats/applications/${haneulApp.id}`)
).data

async function open(
  who,
  path,
  { width = 1440, height = 900, mobile = false } = {},
) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
  })
  const token = who ? auth[who] : null
  if (token)
    await ctx.addInitScript(
      ([a, r]) => {
        sessionStorage.setItem('accessToken', a)
        localStorage.setItem('refreshToken', r)
      },
      [token.accessToken, token.refreshToken],
    )
  await ctx.route('**/api/chats/stream', (route) => route.abort())
  const page = await ctx.newPage()
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  return page
}
async function shot(name, page, options = {}) {
  await page.screenshot({ path: `${out}${name}.png`, ...options })
  console.log('✓', name)
  await page.context().close()
}
const want = (name) => !only || name.includes(only)

// ── 사용자 ──
if (want('01-home')) {
  const page = await open(null, '/home')
  await shot('01-home', page)
}
if (want('02-campaign-purchase-review')) {
  const page = await open(null, `/campaign/${coffee}`)
  await shot('02-campaign-purchase-review', page)
}
if (want('03-apply-form')) {
  const page = await open('minji', `/campaign/${mist}`)
  if (
    !(await page
      .getByLabel('신청 메시지')
      .isVisible()
      .catch(() => false))
  )
    await page.getByRole('button', { name: /신청/ }).first().click()
  await page
    .getByLabel('신청 메시지')
    .fill('거실과 침실 두 공간에서 향을 비교해 15초 클립으로 담아 보겠습니다.')
  for (const [label, value] of [
    ['수령인', '이민지'],
    ['연락처', '010-3920-1184'],
    ['우편번호', '04048'],
    ['주소', '서울특별시 마포구 와우산로 94'],
    ['상세주소 (선택)', '302호'],
  ])
    await page.getByLabel(label, { exact: true }).fill(value)
  // '캠페인 신청서' 제목이 화면 위쪽에 오도록 맞춥니다.
  await page.getByText('캠페인 신청서', { exact: true }).evaluate((el) => {
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 32)
  })
  await page.evaluate(() => document.activeElement?.blur())
  await page.waitForTimeout(400)
  await shot('03-apply-form', page)
}
if (want('04-my-campaign-workspace')) {
  const page = await open('haneul', '/mypage/campaigns')
  await page
    .getByRole('navigation', { name: '내 캠페인 선택' })
    .getByRole('button', { name: /시카 수분 앰플/ })
    .first()
    .click()
  await page.waitForTimeout(1200)
  await shot('04-my-campaign-workspace', page, { fullPage: true })
}
if (want('05-mypage-grade')) {
  const page = await open('haneul', '/mypage')
  await shot('05-mypage-grade', page)
}
if (want('06-chat')) {
  const page = await open('haneul', `/messages?room=${room.id}`)
  await page.waitForTimeout(1500)
  await shot('06-chat', page)
}
if (want('07-community')) {
  const posts = (await call(auth.haneul, 'GET', '/community/posts?board=free'))
    .data.items
  const post = posts.find((p) => p.title.startsWith('체험단 처음이신 분들'))
  const page = await open('minji', `/community/free/${post.id}`)
  await shot('07-community', page)
}

// ── 업체 ──
if (want('10-seller-dashboard')) {
  const page = await open('studio', '/seller/dashboard')
  await shot('10-seller-dashboard', page)
}
if (want('11-seller-campaign-editor')) {
  const page = await open('studio', `/seller/campaigns/${coffee}`)
  await page.waitForTimeout(1200)
  await shot('11-seller-campaign-editor', page)
}
if (want('12-seller-participants')) {
  const page = await open(
    'studio',
    `/seller/participants?campaignId=${ampoule}`,
  )
  await shot('12-seller-participants', page)
}
if (want('13-seller-participant-detail')) {
  const page = await open(
    'studio',
    `/seller/participants?campaignId=${ampoule}`,
  )
  await page
    .getByRole('button', { name: new RegExp(`신청 ${haneulApp.id} 상세 보기`) })
    .click()
  await page.waitForTimeout(1500)
  await page.locator('dialog .participant-activity').scrollIntoViewIfNeeded()
  await shot('13-seller-participant-detail', page)
}
if (want('14-seller-shipping')) {
  const page = await open('studio', `/seller/shipping?campaignId=${ampoule}`)
  await shot('14-seller-shipping', page)
}
if (want('15-seller-paybacks')) {
  const page = await open('studio', '/seller/paybacks')
  await shot('15-seller-paybacks', page)
}

// ── 운영자 ──
// 운영자 화면은 통합 DB의 점검용 데이터와 섞여 있어, 시연 데이터만 보이도록 좁혀서 찍습니다.
if (want('20-admin-content-reviews')) {
  const page = await open('admin', '/admin/content-reviews')
  await page
    .getByPlaceholder('참여자·캠페인 이름 또는 번호')
    .fill('시카 수분 앰플')
  await page.evaluate(() => document.activeElement?.blur())
  await page.waitForTimeout(800)
  await shot('20-admin-content-reviews', page)
}
if (want('21-admin-moderation')) {
  const page = await open('admin', '/admin/moderation')
  await page.getByRole('button', { name: '보기' }).first().click()
  await page.waitForTimeout(800)
  await shot('21-admin-moderation', page)
}

// ── 모바일 ──
if (want('30-mobile-home')) {
  const page = await open(null, '/home', {
    width: 390,
    height: 844,
    mobile: true,
  })
  await shot('30-mobile-home', page)
}
if (want('31-mobile-campaign')) {
  const page = await open(null, `/campaign/${ampoule}`, {
    width: 390,
    height: 844,
    mobile: true,
  })
  await shot('31-mobile-campaign', page)
}
if (want('32-mobile-chat')) {
  const page = await open('haneul', `/messages?room=${room.id}`, {
    width: 390,
    height: 844,
    mobile: true,
  })
  await page.waitForTimeout(1500)
  await shot('32-mobile-chat', page)
}
await browser.close()
