// 제출 전 점검 화면 점검: 참여자가 본문을 붙여 넣고 점검하면 결과가 보이는지 확인합니다(실제 AI 1회 호출, 제출은 하지 않음).
// 실행: qa/ 폴더에서 MOVRIT_QA_PASSWORD=... QA_BASE=http://localhost:5175 QA_API=http://localhost:18081/api node e2e/content-precheck-check.mjs
import { chromium } from 'playwright-core'

const base = process.env.QA_BASE || 'http://localhost:5174'
const api = process.env.QA_API || 'http://localhost:18080/api'
const shots = process.env.QA_SHOTS || '.'
const res = await fetch(`${api}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'minji@movrit.local',
    password: process.env.MOVRIT_QA_PASSWORD,
  }),
})
if (!res.ok) throw new Error(`로그인 실패 ${res.status}`)
const auth = await res.json()
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const width = Number(process.env.QA_WIDTH || 1280)
const ctx = await browser.newContext({ viewport: { width, height: 900 } })
await ctx.addInitScript(
  ([a, r]) => {
    sessionStorage.setItem('accessToken', a)
    localStorage.setItem('refreshToken', r)
  },
  [auth.accessToken, auth.refreshToken],
)
await ctx.route('**/api/chats/stream', (route) => route.abort())
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto(`${base}/mypage/campaigns`, { waitUntil: 'networkidle' })
const card = page
  .getByRole('button', { name: /패브릭 미스트 공간 리뷰 체험단/ })
  .first()
await card.click()
await page.waitForLoadState('networkidle')
const panel = page.locator('fieldset', { hasText: '제출 전 점검' }).first()
await panel.scrollIntoViewIfNeeded()
await panel
  .getByLabel('게시할 본문')
  .fill(
    '[협찬] 업체로부터 패브릭 미스트를 제공받아 작성했습니다.\n거실 소파에 2주 동안 뿌려 봤어요. 코튼 향이 은은합니다. #패브릭미스트',
  )
await panel.getByRole('button', { name: '제출 전 점검하기' }).click()
await panel
  .locator('.my-campaign-content__precheck-result')
  .waitFor({ timeout: 60000 })
const items = await panel.locator('.my-campaign-content__precheck-item').count()
const firstStatus = await panel
  .locator('.my-campaign-content__precheck-item span')
  .first()
  .textContent()
await panel.screenshot({ path: `${shots}/content_precheck_${width}.png` })
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth,
)
console.log(
  JSON.stringify({ items, firstStatus, overflow, errors: errors.length }),
)
await browser.close()
