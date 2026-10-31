// E2E 2단계: 이메일 인증을 마친 신규 사용자가 캠페인 상세 화면에서 신청서를 작성해 신청합니다.
import fs from 'node:fs'
import { base, call, login, openBrowser, pageAs } from './e2e-lib.mjs'

const id = fs.readFileSync('./e2e/campaign-id.txt', 'utf8').trim()
const email = process.env.EMAIL || 'claude-e2e-user@movrit.local'
const user = await login(email)
const browser = await openBrowser()
const page = await pageAs(browser, user)
await page.goto(`${base}/campaign/${id}`, { waitUntil: 'networkidle' })
await page.screenshot({ path: './e2e/3_user_detail.png', fullPage: true })
// 상세 화면에 신청서가 바로 보이지 않으면 신청 버튼으로 엽니다.
if (
  !(await page
    .getByLabel('신청 메시지')
    .isVisible()
    .catch(() => false))
) {
  const open = page.getByRole('button', { name: /신청/ }).first()
  console.log('신청 버튼:', await open.textContent())
  await open.click()
}
await page
  .getByLabel('신청 메시지')
  .fill('평소 스킨케어 리뷰를 꾸준히 올리고 있습니다. 성실히 참여하겠습니다.')
await page.getByLabel('수령인').fill('검수사용자')
await page.getByLabel('연락처').fill('010-0000-0000')
await page.getByLabel('우편번호').fill('04524')
await page
  .getByLabel('주소', { exact: true })
  .fill('서울특별시 중구 세종대로 110')
for (const box of await page
  .locator('form.live-application-form input[type=checkbox][required]')
  .all())
  await box.check()
await page.screenshot({ path: './e2e/4_user_form.png', fullPage: true })
await page.getByRole('button', { name: '신청하기' }).click()
await page.waitForTimeout(2500)
console.log(
  '알림/상태:',
  await page.locator('[role=status],[role=alert]').allTextContents(),
)
await page.screenshot({ path: './e2e/5_user_applied.png', fullPage: true })
const mine = await call(user, 'GET', '/campaigns/applications/mine')
const app = mine.data.find((a) => String(a.campaignId) === id)
console.log('내 신청:', app && { id: app.id, status: app.status })
if (app)
  fs.writeFileSync(
    process.env.APP_FILE || './e2e/application-id.txt',
    String(app.id),
  )
console.log('페이지 오류:', page.errors)
await browser.close()
