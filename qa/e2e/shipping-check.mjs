// 배송 관리(배송지 엑셀 내려받기·송장 일괄 입력·발송 알림·수령 확인 잠금)를 실제 화면으로 확인합니다.
// 점검용 배송형 캠페인을 만들고, 끝나면 마감합니다.
import fs from 'node:fs'
import { base, call, login, openBrowser, pageAs } from './e2e-lib.mjs'
import { applyDelivery, createCampaign, local } from './fixtures.mjs'

const brand = await login('demo-brand@movrit.local')
const userA = await login('demo-user@movrit.local')
const userB = await login('demo-creator@movrit.local')
const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`)
}
const stamp = local(new Date(), false).replace('T', ' ')
const campaignId = await createCampaign(brand, {
  title: `[QA-SHIP] 배송 점검 ${stamp}`,
  recruit: 2,
})
const appA = await applyDelivery(userA, campaignId, '참여자에이')
const appB = await applyDelivery(userB, campaignId, '참여자비')
await call(brand, 'PATCH', `/campaigns/applications/${appA}/select`)
await call(brand, 'PATCH', `/campaigns/applications/${appB}/select`)

const browser = await openBrowser()
const bp = await pageAs(browser, brand)
await bp.goto(`${base}/seller/shipping?campaignId=${campaignId}`, {
  waitUntil: 'networkidle',
})
await bp.getByText('배송 대상 2명').waitFor({ timeout: 10000 })
check(
  '배송 대상·발송 전 인원',
  (await bp.getByText('발송 전 2명').count()) === 1,
)

// 1) 엑셀 내려받기: 실제 xlsx(zip) 파일이고 두 사람의 배송지가 담겨 있습니다.
const [download] = await Promise.all([
  bp.waitForEvent('download'),
  bp.getByRole('button', { name: '배송지 엑셀 내려받기' }).click(),
])
const file = `./e2e/${download.suggestedFilename()}`
await download.saveAs(file)
const bytes = fs.readFileSync(file)
check(
  '엑셀 파일(xlsx) 내려받기',
  download.suggestedFilename().endsWith('.xlsx') &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b,
  download.suggestedFilename(),
)

// 2) 잘못된 송장번호는 저장 버튼이 막힙니다.
await bp.getByLabel(`신청 ${appA} 택배사`).selectOption('CJ대한통운')
await bp.getByLabel(`신청 ${appA} 송장번호`).fill('12 34')
check(
  '잘못된 송장번호 안내·저장 막힘',
  await bp.getByRole('button', { name: /입력한 송장 저장/ }).isDisabled(),
)

// 3) 두 사람 송장을 한 번에 저장 → 참여자 알림
await bp.getByLabel(`신청 ${appA} 송장번호`).fill('689812345678')
await bp.getByLabel(`신청 ${appB} 택배사`).selectOption('우체국택배')
await bp.getByLabel(`신청 ${appB} 송장번호`).fill('6012345678901')
await bp.getByRole('button', { name: '입력한 송장 저장 (2건)' }).click()
check(
  '송장 2건 저장',
  await bp
    .getByText(/송장 2건을 저장하고 참여자에게 알렸습니다/)
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false),
)
await bp.waitForTimeout(1000)
check('발송 인원 갱신', (await bp.getByText('발송 2명').count()) === 1)
const notes = (await call(userA, 'GET', '/notifications')).data
const list = Array.isArray(notes) ? notes : notes?.content || []
check(
  '참여자 발송 알림',
  JSON.stringify(list.slice(0, 3)).includes('체험 상품이 발송되었습니다'),
)

// 4) 참여자 '내 캠페인'에 송장번호 표시
const ua = await pageAs(browser, userA)
await ua.goto(`${base}/mypage/campaigns`, { waitUntil: 'networkidle' })
await ua
  .getByRole('navigation', { name: '내 캠페인 선택' })
  .getByRole('button', { name: /QA-SHIP/ })
  .first()
  .click()
const card = ua.getByRole('region', { name: '배송 상태' })
check(
  '참여자 화면 택배사·송장번호',
  await card
    .getByText('689812345678')
    .waitFor({ timeout: 8000 })
    .then(() => true)
    .catch(() => false),
)
await ua.screenshot({ path: './e2e/shipping_user.png', fullPage: true })

// 5) 수령 확인 뒤에는 그 줄을 고칠 수 없습니다(API도 거절).
await call(userA, 'PATCH', `/campaigns/applications/${appA}/experience-confirm`)
await bp.reload({ waitUntil: 'networkidle' })
check(
  '수령 확인 줄 잠금',
  await bp.getByLabel(`신청 ${appA} 송장번호`).isDisabled(),
)
check('수령 확인 1명 표시', (await bp.getByText('수령 확인 1명').count()) === 1)
const locked = (
  await call(brand, 'PUT', `/campaigns/${campaignId}/shipping`, {
    shipments: [
      { applicationId: appA, courier: '한진택배', trackingNumber: '999999999' },
    ],
  })
).data
check(
  '수령 확인 뒤 변경은 건별 실패',
  locked.failureCount === 1 && locked.results[0].message.includes('수령'),
)
await bp.screenshot({ path: './e2e/shipping_seller.png', fullPage: true })

// 6) 다른 업체·참여자는 배송 목록을 볼 수 없습니다.
check(
  '참여자는 배송 목록 조회 불가',
  (await call(userB, 'GET', `/campaigns/${campaignId}/shipping`)).status >= 403,
)

console.log('페이지 오류:', [...bp.errors, ...ua.errors])
await call(brand, 'PATCH', `/collaborations/campaigns/${campaignId}/close`)
fs.rmSync(file, { force: true })
await browser.close()
console.log(`\n결과: ${results.filter(Boolean).length}/${results.length} 통과`)
