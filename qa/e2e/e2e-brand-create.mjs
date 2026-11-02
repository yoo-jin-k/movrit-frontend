// E2E 1단계: 브랜드 계정이 실제 작성 화면(/seller/campaigns/new)에서 새 캠페인을 등록합니다.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import { password } from './e2e-lib.mjs'

const base = 'http://localhost:5174'
const out = './e2e'
fs.mkdirSync(out, { recursive: true })
const auth = await (
  await fetch('http://localhost:18080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo-brand@movrit.local',
      password,
    }),
  })
).json()
const pad = (n) => String(n).padStart(2, '0')
const local = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
const now = new Date()
const start = new Date(now.getTime() - 60 * 60 * 1000)
const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
const title = `[QA-E2E] 전체 흐름 검증 ${local(now).replace('T', ' ')}`

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
await ctx.addInitScript(
  ([a, r]) => {
    sessionStorage.setItem('accessToken', a)
    localStorage.setItem('refreshToken', r)
  },
  [auth.accessToken, auth.refreshToken],
)
// 채팅 실시간 연결은 계속 열려 있어 'networkidle' 대기가 끝나지 않으므로 막습니다(e2e-lib의 pageAs와 같은 방식).
await ctx.route('**/api/chats/stream', (route) => route.abort())
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto(`${base}/seller/campaigns/new`, { waitUntil: 'networkidle' })
await page.getByLabel('모집 제목').fill(title)
await page
  .getByLabel('설명')
  .fill('E2E 검증용 캠페인입니다. 신청부터 최종 승인까지 확인합니다.')
await page.getByLabel('캠페인 종류').selectOption('PRODUCT')
await page.getByLabel('콘텐츠 채널').selectOption('INSTAGRAM')
await page.getByLabel('카테고리').fill('뷰티')
await page.getByLabel('제공 내역').fill('수분 세럼 1개')
await page.getByLabel('모집 인원').fill(process.env.RECRUIT || '3')
await page.getByLabel('모집 시작 (한국시간)').fill(local(start))
await page.getByLabel('모집 종료 (한국시간)').fill(local(end))
await page.getByRole('checkbox', { name: '배송형', exact: true }).check()
await page
  .getByLabel('대표 이미지 · 1장')
  .setInputFiles(
    new URL('../../public/assets/discovery/banners/review.png', import.meta.url)
      .pathname,
  )
await page.screenshot({ path: `${out}/1_brand_form.png`, fullPage: true })
await page.getByRole('button', { name: '캠페인 등록' }).click()
const result = await Promise.race([
  page
    .getByRole('status')
    .filter({ hasText: '저장하고 다시 확인했습니다' })
    .waitFor({ timeout: 20000 })
    .then(() => 'ok'),
  page
    .locator('[role=alert]')
    .first()
    .waitFor({ timeout: 20000 })
    .then(
      async () =>
        'error: ' +
        (await page.locator('[role=alert]').allTextContents()).join(' | '),
    ),
]).catch((e) => 'timeout ' + e.message)
console.log('등록 결과:', result)
await page.screenshot({ path: `${out}/2_brand_saved.png`, fullPage: true })
const list = await (
  await fetch('http://localhost:18080/api/collaborations/campaigns/seller', {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  })
).json()
const created = list.find((c) => c.title === title)
console.log(
  '생성된 캠페인:',
  created && {
    id: created.id,
    type: created.campaignType,
    channel: created.contentChannel,
    brand: created.brandName,
    preorderId: created.preorderId,
    image: Boolean(created.representativeImageUrl),
  },
)
if (created) fs.writeFileSync(`${out}/campaign-id.txt`, String(created.id))
console.log('페이지 오류:', errors)
await browser.close()
