// E2E 3~8단계: 업체 선정(즉시 참여 중) → 체험 완료 확인 → 콘텐츠 제출 → 업체 검토 완료(화면) → 운영자 최종 승인(API)
import fs from 'node:fs'
import { base, call, login, openBrowser, pageAs } from './e2e-lib.mjs'

const appId = fs.readFileSync('./e2e/application-id.txt', 'utf8').trim()
const brand = await login('demo-brand@movrit.local')
const user = await login('demo-user@movrit.local')
const admin = await login('demo-admin@movrit.local')
const browser = await openBrowser()
const status = async (label) => {
  const mine = await call(user, 'GET', '/campaigns/applications/mine')
  const app = mine.data.find((a) => String(a.id) === appId)
  console.log(`[${label}] 신청 상태:`, app?.status)
  return app
}
const step = async (name, fn) => {
  try {
    await fn()
  } catch (e) {
    console.log(`!! ${name} 실패:`, e.message.split('\n')[0])
  }
}

// 3) 업체가 참여자 화면에서 선정
const b = await pageAs(browser, brand)
await step('업체 선정', async () => {
  if ((await status('시작')).status !== 'SUBMITTED') return
  await b.goto(`${base}/seller/participants`, { waitUntil: 'networkidle' })
  await b
    .getByRole('button', { name: new RegExp(`신청 ${appId} 상세 보기`) })
    .click()
  await b.getByRole('button', { name: '참여자 선정' }).click()
  await b.getByRole('button', { name: '확정' }).click()
  await b.waitForTimeout(1500)
  await b.screenshot({ path: './e2e/6_brand_selected.png', fullPage: true })
})
await status('선정 후')

// 4~6) 사용자가 내 캠페인 화면에서 체험 완료 확인 → 콘텐츠 제출(선정되면 참여 수락 없이 바로 참여 중입니다)
const u = await pageAs(browser, user)
const openMine = async () => {
  await u.goto(`${base}/mypage/campaigns`, { waitUntil: 'networkidle' })
  await u
    .getByRole('navigation', { name: '내 캠페인 선택' })
    .getByRole('button', { name: /QA-E2E/ })
    .first()
    .click()
  return u.getByRole('region', { name: `신청 ${appId} 콘텐츠` })
}
await status('선정 직후(참여 중이어야 합니다)')
await step('체험 완료 확인', async () => {
  const sec = await openMine()
  await sec.getByRole('button', { name: '체험 완료 확인' }).click()
  await sec.getByRole('button', { name: '확인하여 반영' }).click()
  await u.waitForTimeout(1500)
})
await status('체험 완료 후')
await step('콘텐츠 제출', async () => {
  const sec = await openMine()
  await sec.getByLabel('게시 채널 1').selectOption('INSTAGRAM')
  await sec
    .getByLabel('콘텐츠 URL 1')
    .fill('https://www.instagram.com/p/QAE2E20261031/')
  await sec.getByLabel('제출 메모 (선택)').fill('E2E 검증용 제출입니다.')
  await sec.getByRole('button', { name: '콘텐츠 제출' }).click()
  await u.waitForTimeout(1500)
  await u.screenshot({ path: './e2e/7_user_submitted.png', fullPage: true })
})
await status('콘텐츠 제출 후')

// 7) 업체가 콘텐츠 화면에서 검토 완료
await step('업체 검토 완료', async () => {
  await b.goto(`${base}/seller/contents`, { waitUntil: 'networkidle' })
  const row = b.locator('tr', { hasText: 'QA-E2E' }).first()
  await row.getByRole('button', { name: '콘텐츠 검토' }).click()
  await b.getByLabel('검토 결과').selectOption('approve')
  await b.getByLabel(/검토 의견/).fill('가이드에 맞게 잘 작성되었습니다.')
  await b.getByRole('button', { name: '검토 결과 저장' }).click()
  await b.waitForTimeout(1500)
  await b.screenshot({ path: './e2e/8_brand_reviewed.png', fullPage: true })
})
await status('업체 검토 후')

// 8) 운영자 최종 승인(운영자 화면이 없어 API로 확인)
const list = await call(admin, 'GET', '/admin/campaign-contents')
const items = Array.isArray(list.data) ? list.data : list.data?.content || []
const target = items.find((s) => String(s.applicationId) === appId)
console.log(
  '운영자 목록 조회:',
  list.status,
  '대상:',
  target && { id: target.id, status: target.status, version: target.version },
)
if (target) {
  const r = await call(
    admin,
    'PATCH',
    `/admin/campaign-contents/${target.id}/approve`,
    {
      comment: '최종 승인합니다.',
      expectedVersion: target.version,
    },
  )
  console.log('최종 승인:', r.status, r.data?.status)
}
await status('최종 승인 후')

// 9) 사용자 화면·알림 확인
await openMine()
await u.screenshot({ path: './e2e/9_user_completed.png', fullPage: true })
const noti = await call(user, 'GET', '/notifications')
const notes = Array.isArray(noti.data) ? noti.data : noti.data?.content || []
console.log(
  '사용자 최근 알림:',
  notes.slice(0, 6).map((n) => n.message || n.title),
)
console.log('페이지 오류:', [...b.errors, ...u.errors])
await browser.close()
