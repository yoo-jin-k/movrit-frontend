// 운영자 최종 승인 화면 점검: 업체 검토까지 끝난 콘텐츠를 /admin/content-reviews 에서 최종 승인합니다.
import fs from 'node:fs'
import { base, call, login, openBrowser, pageAs } from './e2e-lib.mjs'

const appId = fs.readFileSync('./e2e/application-id.txt', 'utf8').trim()
const admin = await login('claude-e2e-admin@movrit.local')
const user = await login('claude-e2e-user@movrit.local')
const list = (await call(admin, 'GET', '/admin/campaign-contents')).data
const target = list.find((s) => String(s.applicationId) === appId)
console.log('대상 콘텐츠:', target && { id: target.id, status: target.status })
const browser = await openBrowser()
const page = await pageAs(browser, admin)
await page.goto(`${base}/admin/content-reviews`, { waitUntil: 'networkidle' })
await page.screenshot({
  path: './e2e/12_admin_reviews_list.png',
  fullPage: true,
})
const row = page.locator('tr', { hasText: `#${target.id}` })
await row.getByRole('button', { name: '콘텐츠 확인' }).click()
// 수정 요청은 의견이 없으면 막히는지 확인합니다.
await page.getByLabel('처리 방법').selectOption('request-revision')
await page.getByRole('button', { name: '수정 요청 보내기' }).click()
console.log(
  '의견 없이 수정 요청:',
  await page.locator('[role=alert]').allTextContents(),
)
await page.getByLabel('처리 방법').selectOption('approve')
await page
  .getByLabel(/의견/)
  .fill('가이드를 잘 지켜 주셨습니다. 최종 승인합니다.')
await page.screenshot({
  path: './e2e/13_admin_review_detail.png',
  fullPage: true,
})
await page.getByRole('button', { name: '최종 승인' }).click()
await page.waitForTimeout(1500)
console.log('안내:', await page.locator('[role=status]').allTextContents())
const mine = (await call(user, 'GET', '/campaigns/applications/mine')).data
console.log('신청 상태:', mine.find((a) => String(a.id) === appId)?.status)
console.log('페이지 오류:', page.errors)
await browser.close()
