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
// 다른 업체 캠페인은 공개 검색으로 찾습니다(seed-catalog.mjs 데이터).
const findPublic = async (q) =>
  (
    await call(
      auth.minji,
      'GET',
      `/collaborations/campaigns/search?q=${encodeURIComponent(q)}&size=5`,
    )
  ).data.items[0]?.id

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
if (want('02b-campaign-first-come')) {
  const latte = await findPublic('연남동 로스터리 라떼')
  const page = await open(null, `/campaign/${latte}`)
  await shot('02b-campaign-first-come', page)
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
if (want('04b-my-campaign-change')) {
  // 선정되어 진행 중인 캠페인의 참여 조정(참여 취소·협의 취소·기간 연장) 영역
  const page = await open('minji', '/mypage/campaigns')
  await page
    .getByRole('navigation', { name: '내 캠페인 선택' })
    .getByRole('button', { name: /그래놀라/ })
    .first()
    .click()
  await page.waitForTimeout(1200)
  await page.getByRole('region', { name: '참여 조정' }).evaluate((el) => {
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 240)
  })
  await page.waitForTimeout(400)
  await shot('04b-my-campaign-change', page)
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

if (want('08-category-list')) {
  const page = await open(null, '/category/지역')
  // 카드 이미지는 화면에 들어올 때 불러오므로 끝까지 천천히 내려 모두 불러온 뒤 찍습니다.
  for (let y = 0; y < 4000; y += 600) {
    await page.evaluate((top) => window.scrollTo(0, top), y)
    await page.waitForTimeout(250)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForLoadState('networkidle')
  await shot('08-category-list', page, { fullPage: true })
}
if (want('09-my-campaign-calendar')) {
  const page = await open('minji', '/mypage/campaigns')
  await page.getByRole('tab', { name: '달력' }).click()
  await page.waitForTimeout(800)
  await shot('09-my-campaign-calendar', page)
}
if (want('00-signup')) {
  const page = await open(null, '/signup')
  await page.locator('.common-role-business').scrollIntoViewIfNeeded()
  await shot('00-signup', page)
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

if (want('16-seller-content-performance')) {
  const page = await open('studio', '/seller/contents')
  await page
    .getByLabel('성과를 볼 캠페인')
    .selectOption({ label: '시카 수분 앰플 2주 사용 후기 체험단' })
  await page.getByText('조회수 합계').waitFor()
  await page.waitForTimeout(400)
  await shot('16-seller-content-performance', page)
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

if (want('22-admin-community')) {
  const page = await open('admin', '/admin/community')
  await page.getByLabel('검색어').fill('체험단 처음이신 분들')
  await page.getByRole('button', { name: '검색' }).click()
  await page.waitForTimeout(800)
  await page
    .getByRole('button', { name: /^글 \d+ 보기$/ })
    .first()
    .click()
  await page.getByText(/^댓글 \d+개$/).waitFor()
  await page.evaluate(() => document.activeElement?.blur())
  // 글 본문 아래 댓글 목록(가리기 버튼)이 화면에 함께 들어오도록 올립니다.
  await page.getByText(/^글 #\d+ · /).evaluate((el) => {
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 24)
  })
  await page.waitForTimeout(400)
  await shot('22-admin-community', page)
}
if (want('23-admin-reports')) {
  const page = await open('admin', '/admin/reports')
  await page.getByText('날짜별 추이').waitFor()
  await shot('23-admin-reports', page)
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
