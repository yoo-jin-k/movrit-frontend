// 관리자 화면 실제 데이터 점검: 각 화면이 오류 없이 서버 데이터를 보여주는지, 예시 문구가 남지 않았는지 확인하고
// 공지 작성 → 사용자 공지 화면 표시, 회원 정지·해제, 검색 필터 동작을 확인합니다.
import { base, call, login, openBrowser, pageAs } from './e2e-lib.mjs'

const admin = await login('claude-e2e-admin@movrit.local')
const browser = await openBrowser()
const page = await pageAs(browser, admin)
const shot = async (name) =>
  page.screenshot({ path: `./shots/admin_${name}.png`, fullPage: true })
const routes = [
  ['/admin/members', 'members'],
  ['/admin/members/78', 'member_detail'],
  ['/admin/sellers/12', 'seller_detail'],
  ['/admin/creators', 'creators'],
  ['/admin/creators/26', 'creator_detail'],
  ['/admin/preorders', 'preorders'],
  ['/admin/preorders/9', 'preorder_detail'],
  ['/admin/refunds', 'refunds'],
  ['/admin/refunds/2', 'refund_detail'],
  ['/admin/collaborations', 'collaborations'],
  ['/admin/settlements', 'settlements'],
  ['/admin/content', 'content'],
  ['/admin/reports', 'reports'],
  ['/admin/settings', 'settings'],
]
for (const [route, name] of routes) {
  page.errors.length = 0
  await page.goto(base + route, { waitUntil: 'networkidle' })
  const text = await page.locator('main').innerText()
  const sample =
    text.includes('운영 화면 예시') || text.includes('실제 조회 결과가 아니며')
  const failed = /불러오지 못했습니다|찾을 수 없습니다|권한이 없습니다/.test(
    text,
  )
  const rows = await page.locator('table tbody tr').count()
  console.log(
    `${failed || sample || page.errors.length ? '✗' : '✓'} ${route} 행 ${rows}${sample ? ' (예시 문구 남음)' : ''}${failed ? ' (불러오기 실패)' : ''} ${page.errors.join('|')}`,
  )
  await shot(name)
}

// 검색 필터: 회원 목록에서 이메일로 검색하면 한 명만 남는지
await page.goto(`${base}/admin/members`, { waitUntil: 'networkidle' })
await page.getByPlaceholder('이름, 닉네임, 이메일 검색').fill('claude-e2e-user')
console.log('회원 검색 결과 행:', await page.locator('table tbody tr').count())

// 공지 작성 → 사용자 화면 표시
const title = `[시연] 11월 캠페인 운영 안내 ${Date.now() % 100000}`
await page.goto(`${base}/admin/content`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: '새 공지 쓰기' }).click()
await page.getByLabel('제목').fill(title)
await page
  .getByLabel('내용')
  .fill(
    '11월 캠페인은 매주 월요일에 새로 열립니다.\n\n선정 결과는 마이페이지 > 내 캠페인에서 확인해 주세요.',
  )
await page.getByLabel('목록 맨 위에 고정').check()
await page.getByRole('button', { name: '저장' }).click()
await page.waitForTimeout(1000)
console.log(
  '공지 저장 안내:',
  await page.locator('[role=status]').allTextContents(),
)
await shot('content_after')
const guest = await pageAs(browser, null)
await guest.goto(`${base}/notices`, { waitUntil: 'networkidle' })
const listText = await guest.locator('body').innerText()
console.log('사용자 공지 목록에 표시:', listText.includes(title))
await guest
  .getByRole('link', { name: new RegExp(title.replace(/[[\]]/g, '.')) })
  .click()
await guest
  .getByText('매주 월요일')
  .waitFor({ timeout: 10000 })
  .catch(() => {})
console.log(
  '사용자 공지 상세 본문 표시:',
  (await guest.locator('body').innerText()).includes('매주 월요일'),
)
await guest.screenshot({
  path: './shots/user_notice_detail.png',
  fullPage: true,
})

// 회원 정지 → 해제 (점검용 사용자 계정)
await page.goto(`${base}/admin/members/76`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: '계정 정지' }).click()
await page.getByRole('button', { name: '확인' }).click()
await page.waitForTimeout(1000)
console.log(
  '정지 후 상태:',
  (await call(admin, 'GET', '/admin/members/76')).data.member.status,
)
await page.getByRole('button', { name: '정지 해제' }).click()
await page.getByRole('button', { name: '확인' }).click()
await page.waitForTimeout(1000)
console.log(
  '해제 후 상태:',
  (await call(admin, 'GET', '/admin/members/76')).data.member.status,
)
// 운영자 본인 계정은 서버가 막는지
console.log(
  '본인 계정 정지 요청:',
  (await call(admin, 'PATCH', '/members/admin/79/status?status=SUSPENDED'))
    .status,
)
console.log('페이지 오류:', page.errors, guest.errors)
await browser.close()
