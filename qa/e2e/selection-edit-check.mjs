// 모집 현황 표시·선정 즉시 참여 시작·선정 편집(선정 취소·참여 취소·미선정 되돌리기)을 실제 화면으로 확인합니다.
// 준비: RECRUIT=2 로 e2e-brand-create → 두 사용자 e2e-apply(qa-app-a, qa-app-b) 를 먼저 실행합니다.
import fs from 'node:fs'
import { base, call, login, openBrowser, pageAs } from './e2e-lib.mjs'

const campaignId = fs.readFileSync('./e2e/campaign-id.txt', 'utf8').trim()
const appA = fs.readFileSync('./e2e/qa-app-a.txt', 'utf8').trim()
const appB = fs.readFileSync('./e2e/qa-app-b.txt', 'utf8').trim()
const brand = await login('claude-design-brand@movrit.local')
const userA = await login('claude-e2e-user@movrit.local')
const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`)
}
const statusOf = async (id) =>
  (await call(brand, 'GET', '/campaigns/applications/seller')).data.find(
    (a) => String(a.id) === id,
  )?.status
const browser = await openBrowser()

// 1) 사용자 상세: 신청 2 / 모집 2명
const guest = await pageAs(browser, null)
await guest.goto(`${base}/campaign/${campaignId}`, { waitUntil: 'networkidle' })
await guest.getByText(/신청 \d+ \/ 모집 \d+명/).waitFor({ timeout: 10000 })
check(
  '사용자 상세에 모집 현황 표시',
  true,
  await guest.getByText(/신청 \d+ \/ 모집 \d+명/).innerText(),
)
await guest.screenshot({
  path: './e2e/recruitment_user_detail.png',
  fullPage: true,
})

// 2) 업체: A 선정 → 모집 현황 '선정 1 / 모집 2명'
const page = await pageAs(browser, brand)
await page.goto(`${base}/seller/participants?campaignId=${campaignId}`, {
  waitUntil: 'networkidle',
})
const open = async (id) => {
  await page
    .getByRole('button', { name: new RegExp(`신청 ${id} 상세 보기`) })
    .click()
  await page.waitForTimeout(800)
}
await open(appA)
await page.getByRole('button', { name: '참여자 선정' }).click()
await page.getByRole('button', { name: '확정' }).click()
await page.waitForTimeout(1500)
const summary = await page.locator('.business-recruitment').innerText()
check(
  '업체 화면 모집 현황 갱신',
  summary.includes('선정 1 / 모집 2명'),
  summary.replace(/\n/g, ' '),
)

// 3) 선정과 동시에 참여 중이 되고(참여 수락 단계 없음), 사용자 상세 모집 현황도 새로고침 없이 갱신됩니다.
const rowA = page.locator('tr', {
  has: page.getByRole('button', { name: new RegExp(`신청 ${appA} 상세 보기`) }),
})
check(
  '선정 즉시 참여 중으로 표시',
  await rowA
    .getByText('선정 · 참여 중')
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false),
)
await guest.waitForTimeout(16000)
check(
  '사용자 상세 모집 현황 자동 갱신',
  (await guest.locator('.recruitment-progress').innerText()).includes(
    '선정 1명',
  ),
)

// 4) 업체: A 참여 취소(사유 필수)
await open(appA)
await page.screenshot({
  path: './e2e/selection_edit_detail.png',
  fullPage: true,
})
await page.getByRole('button', { name: '참여 취소', exact: true }).click()
await page.getByRole('button', { name: '참여 취소 확정' }).click()
check(
  '사유 없이 참여 취소는 막힘',
  (await page.locator('[role=alert]').allTextContents()).some((t) =>
    t.includes('사유'),
  ),
)
await page
  .getByLabel(/취소 사유/)
  .fill('참여자 요청으로 일정이 맞지 않아 취소합니다.')
await page.getByRole('button', { name: '참여 취소 확정' }).click()
await page.waitForTimeout(1500)
check('참여 취소 후 상태 CANCELLED', (await statusOf(appA)) === 'CANCELLED')
const notes = (await call(userA, 'GET', '/notifications')).data
check(
  '참여자에게 취소 알림',
  JSON.stringify(notes.slice(0, 3)).includes('취소'),
)

// 5) B 선정 → 선정 취소 → 다시 접수
await open(appB)
await page.getByRole('button', { name: '참여자 선정' }).click()
await page.getByRole('button', { name: '확정' }).click()
await page.waitForTimeout(1500)
await open(appB)
await page.getByRole('button', { name: '선정 취소', exact: true }).click()
await page.getByRole('button', { name: '선정 취소 확정' }).click()
await page.waitForTimeout(1500)
check(
  '선정 취소 후 다시 접수(SUBMITTED)',
  (await statusOf(appB)) === 'SUBMITTED',
)

// 6) B 미선정 → 되돌리기
await open(appB)
await page.getByRole('button', { name: '미선정 처리' }).click()
await page.getByRole('button', { name: '확정' }).click()
await page.waitForTimeout(1500)
await open(appB)
await page.getByRole('button', { name: '미선정 되돌리기' }).click()
await page.getByRole('button', { name: '미선정 되돌리기 확정' }).click()
await page.waitForTimeout(1500)
check('미선정 되돌리기 후 다시 접수', (await statusOf(appB)) === 'SUBMITTED')
await page.screenshot({
  path: './e2e/selection_edit_after.png',
  fullPage: true,
})
console.log('페이지 오류:', page.errors, guest.errors)
await browser.close()
console.log(`\n결과: ${results.filter(Boolean).length}/${results.length} 통과`)
