// 개인 계정 채널 '직접 등록' → 운영자 확인 → 업체 참여자 상세 표시까지 실제 화면으로 확인합니다.
// 준비: selection-edit-check 처럼 demo-creator 가 업체(demo-brand) 캠페인에 신청한 상태(./e2e/qa-app-b.txt)가 필요합니다.
// 사용자 팔로워 수는 기존 확인값(1500)과 같게 등록해 다른 점검 흐름의 참여 조건에 영향을 주지 않습니다.
import fs from 'node:fs'
import { base, call, login, openBrowser, pageAs } from './e2e-lib.mjs'

const appB = fs.readFileSync('./e2e/qa-app-b.txt', 'utf8').trim()
const user = await login('demo-creator@movrit.local')
const admin = await login('demo-admin@movrit.local')
const brand = await login('demo-brand@movrit.local')
const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`)
}
// 다시 실행할 수 있도록 기존 인스타그램 연결을 먼저 해제합니다.
await call(user, 'DELETE', '/users/me/channel-connections/instagram')
const browser = await openBrowser()

// 캡처용 PNG를 만듭니다(빈 페이지 화면을 찍어 파일로 씁니다).
const shotPage = await pageAs(browser, null)
await shotPage.setContent(
  '<h1 style="font:40px sans-serif">@movrit.qa · 팔로워 1,500</h1>',
)
const evidencePath = './e2e/qa-evidence.png'
await shotPage.screenshot({ path: evidencePath })

// 1) 사용자: 설정 → 인스타그램 직접 등록
const up = await pageAs(browser, user)
await up.goto(`${base}/settings`, { waitUntil: 'networkidle' })
const sec = up.locator('#channel-connect')
const row = sec.locator('li', { hasText: '인스타그램' })
await row.getByRole('button', { name: '직접 등록' }).click()
await row.getByLabel('채널 주소').fill('https://example.com/movrit.qa')
await row.getByLabel('팔로워 수').fill('1500')
await row.getByLabel(/프로필 화면 캡처/).setInputFiles(evidencePath)
await row.getByRole('button', { name: '등록하기' }).click()
await up.waitForTimeout(1200)
check(
  '잘못된 주소는 안내 후 막힘',
  (await sec.locator('[role=alert]').innerText()).includes('인스타그램 주소'),
)
await row.getByLabel('채널 주소').fill('https://www.instagram.com/movrit.qa/')
await row.getByRole('button', { name: '등록하기' }).click()
await up.waitForTimeout(1500)
check(
  '등록 후 확인 대기 표시',
  (await row.innerText()).includes('직접 등록 · 확인 대기'),
)
await sec.screenshot({ path: './e2e/channel_manual_pending.png' })

// 2) 운영자: 채널 확인 화면에서 캡처 확인 후 승인
const ap = await pageAs(browser, admin)
await ap.goto(`${base}/admin/channel-verifications`, {
  waitUntil: 'networkidle',
})
const adminRow = ap.locator('tr', { hasText: '@movrit.qa' })
check(
  '운영자 목록에 확인 대기로 표시',
  (await adminRow.innerText()).includes('확인 대기'),
)
await adminRow.getByRole('button', { name: '확인하기' }).click()
const img = ap.locator('img.admin-channel-evidence')
await img.waitFor({ timeout: 10000 })
check('캡처 이미지 표시', (await img.evaluate((el) => el.naturalWidth)) > 0)
await ap.getByRole('button', { name: '반려' }).click()
check(
  '사유 없이 반려는 막힘',
  (await ap.locator('[role=alert]').innerText()).includes('반려 사유'),
)
await ap.screenshot({ path: './e2e/channel_admin_review.png', fullPage: true })
await ap.getByRole('button', { name: '확인', exact: true }).click()
await ap.waitForTimeout(1500)
check(
  '운영자 확인 완료 안내',
  (await ap.locator('[role=status]').first().innerText()).includes(
    '확인했습니다',
  ),
)

// 3) 사용자: 알림과 설정 상태, 채널 지표
const notes = (await call(user, 'GET', '/notifications')).data
check(
  '사용자에게 확인 완료 알림',
  notes[0]?.title?.includes('채널 확인이 완료'),
  notes[0]?.title,
)
await up.goto(`${base}/settings`, { waitUntil: 'networkidle' })
await up.waitForTimeout(800)
check(
  '설정에 확인됨 표시',
  (await row.innerText()).includes('직접 등록 · 확인됨'),
)
const metric = (await call(user, 'GET', '/users/me/channel-profile')).data
check('팔로워 지표가 확인됨', JSON.stringify(metric).includes('VERIFIED'))

// 4) 업체: 참여자 상세에 연결 채널 표시
const bp = await pageAs(browser, brand)
await bp.goto(`${base}/seller/participants`, { waitUntil: 'networkidle' })
await bp
  .getByRole('button', { name: new RegExp(`신청 ${appB} 상세 보기`) })
  .click()
await bp.waitForTimeout(1500)
const linked = bp.getByRole('region', { name: '연결한 SNS 채널' })
const text = await linked.innerText()
check(
  '업체 참여자 상세에 연결 채널 표시',
  text.includes('@movrit.qa') && text.includes('확인됨'),
  text.replace(/\n/g, ' '),
)
await bp.screenshot({ path: './e2e/channel_brand_detail.png', fullPage: true })

console.log('페이지 오류:', up.errors, ap.errors, bp.errors)
await browser.close()
console.log(`\n결과: ${results.filter(Boolean).length}/${results.length} 통과`)
