// 구매평 캠페인 전체 흐름을 실제 화면으로 확인합니다.
// 업체 등록(구매 안내) → 상세·구매평 메뉴 표시 → 신청(주소 없음) → 선정 → 구매 인증 → 구매평 제출 → 검토·최종 승인 → 환급 완료 기록 → 참여자 알림
// 점검 뒤 캠페인은 마감(open=false)합니다. 결제·송금은 하지 않습니다.
import fs from 'node:fs'
import { base, call, login, openBrowser, pageAs } from './e2e-lib.mjs'

const out = './e2e'
fs.mkdirSync(out, { recursive: true })
const brand = await login('demo-brand@movrit.local')
const user = await login('demo-user@movrit.local')
const admin = await login('demo-admin@movrit.local')
const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`)
}
const pad = (n) => String(n).padStart(2, '0')
const local = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
const now = new Date()
const title = `[QA-PURCHASE] 구매평 점검 ${local(now).replace('T', ' ')}`
const image = new URL(
  '../../public/assets/discovery/banners/review.png',
  import.meta.url,
).pathname
const browser = await openBrowser()

// 1) 업체 등록: 종류 '구매평'을 고르면 구매 안내 칸이 나오고, 신청서 참여 방식이 '직접 구매'로 맞춰집니다.
const b = await pageAs(browser, brand)
await b.goto(`${base}/seller/campaigns/new`, { waitUntil: 'networkidle' })
await b.getByLabel('모집 제목').fill(title)
await b
  .getByLabel('설명')
  .fill('구매처에서 직접 구매하고 포토 구매평을 남기는 캠페인입니다.')
await b.getByLabel('캠페인 종류').selectOption('PURCHASE_REVIEW')
await b.getByLabel('구매처', { exact: true }).fill('네이버 스마트스토어')
await b
  .getByLabel('상품 페이지 주소')
  .fill('https://smartstore.naver.com/movrit-qa/products/1')
await b.getByLabel('판매가(원)').fill('19900')
await b.getByLabel('환급액(원)').fill('15000')
await b
  .getByLabel(/구매·구매평 작성 안내/)
  .fill("옵션은 '기본형'으로 구매하고 사진 3장 이상 포토 구매평을 남겨 주세요.")
check(
  '실부담 금액 미리 보기',
  (await b.getByText(/참여자 실부담 4,900원/).count()) > 0,
)
check(
  "신청서 참여 방식이 '직접 구매'로 맞춰짐",
  await b.getByRole('checkbox', { name: '직접 구매' }).isChecked(),
)
check(
  '배송형·방문형은 보이지 않음',
  (await b.getByRole('checkbox', { name: '배송형', exact: true }).count()) ===
    0,
)
await b.getByLabel('콘텐츠 채널').selectOption('OTHER')
await b.getByLabel('카테고리').fill('뷰티')
await b.getByLabel('제공 내역').fill('구매평 승인 후 15,000원 환급')
await b.getByLabel('모집 인원').fill('2')
await b
  .getByLabel('모집 시작 (한국시간)')
  .fill(local(new Date(now.getTime() - 3600_000)))
await b
  .getByLabel('모집 종료 (한국시간)')
  .fill(local(new Date(now.getTime() + 7 * 86400_000)))
await b.getByLabel('대표 이미지 · 1장').setInputFiles(image)
await b.screenshot({ path: `${out}/purchase_1_form.png`, fullPage: true })
await b.getByRole('button', { name: '캠페인 등록' }).click()
const saved = await b
  .getByRole('status')
  .filter({ hasText: '저장하고 다시 확인했습니다' })
  .waitFor({ timeout: 20000 })
  .then(() => true)
  .catch(async () => {
    console.log(await b.locator('[role=alert]').allTextContents())
    return false
  })
check('업체 캠페인 등록', saved)
const sellerList = (
  await call(brand, 'GET', '/collaborations/campaigns/seller')
).data
const campaign = sellerList.find((c) => c.title === title)
if (!campaign) throw new Error('등록한 캠페인을 찾지 못했습니다.')
const campaignId = String(campaign.id)
fs.writeFileSync(`${out}/purchase-campaign-id.txt`, campaignId)
const info = await call(
  brand,
  'GET',
  `/collaborations/campaigns/${campaignId}/purchase-review`,
)
check(
  '구매 안내 저장',
  info.status === 200 && info.data.finalPrice === 4900,
  JSON.stringify(info.data),
)

// 2) 공개 상세와 구매평 메뉴
const guest = await pageAs(browser, null)
await guest.goto(`${base}/campaign/${campaignId}`, {
  waitUntil: 'networkidle',
})
const card = guest.getByRole('region', { name: '구매평 구매 안내' })
check(
  '상세에 구매 안내 카드(실부담 4,900원)',
  await card
    .getByText('4,900원')
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false),
)
// 상세 요약 카드 윗줄(브랜드 · 종류 · 참여 방식)에 '직접 구매'가 보여야 합니다.
check(
  '상세 참여 방식 직접 구매',
  /직접 구매/.test(
    await guest.getByRole('region', { name: '캠페인 요약' }).innerText(),
  ),
)
await guest.screenshot({ path: `${out}/purchase_2_detail.png`, fullPage: true })
await guest.goto(`${base}/special/shoppingreview`, { waitUntil: 'networkidle' })
check(
  '구매평 메뉴에 표시',
  await guest
    .getByText(title)
    .first()
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false),
)

// 3) 사용자 신청: 배송 주소 칸 없이 신청합니다.
const u = await pageAs(browser, user)
await u.goto(`${base}/campaign/${campaignId}`, { waitUntil: 'networkidle' })
if (
  !(await u
    .getByLabel('신청 메시지')
    .isVisible()
    .catch(() => false))
)
  await u.getByRole('button', { name: /신청/ }).first().click()
check('신청서에 수령인 칸 없음', (await u.getByLabel('수령인').count()) === 0)
await u
  .getByLabel('신청 메시지')
  .fill('포토 구매평을 꾸준히 남기고 있습니다. 성실히 참여하겠습니다.')
for (const box of await u
  .locator('form.live-application-form input[type=checkbox][required]')
  .all())
  await box.check()
await u.getByRole('button', { name: '신청하기' }).click()
await u.waitForTimeout(2500)
const app = (await call(user, 'GET', '/campaigns/applications/mine')).data.find(
  (a) => String(a.campaignId) === campaignId,
)
check(
  '신청 접수(직접 구매)',
  app?.status === 'SUBMITTED' && app?.fulfillmentType === 'PURCHASE',
)
const appId = String(app.id)
fs.writeFileSync(`${out}/purchase-application-id.txt`, appId)

// 4) 업체 선정(즉시 참여 중) → 체험 완료 확인 API는 구매평에서 막힘
check(
  '업체 선정',
  (await call(brand, 'PATCH', `/campaigns/applications/${appId}/select`))
    .status === 200,
)
check(
  '체험 완료 확인은 구매평에서 409',
  (
    await call(
      user,
      'PATCH',
      `/campaigns/applications/${appId}/experience-confirm`,
    )
  ).status === 409,
)

// 5) 사용자 구매 인증(주문번호·결제 금액·캡처)
const openMine = async () => {
  await u.goto(`${base}/mypage/campaigns`, { waitUntil: 'networkidle' })
  await u
    .getByRole('navigation', { name: '내 캠페인 선택' })
    .getByRole('button', { name: /QA-PURCHASE/ })
    .first()
    .click()
  await u.waitForTimeout(800)
}
await openMine()
const proofBox = u.getByRole('region', { name: '구매 인증과 환급' })
check(
  "'체험 완료 확인' 버튼 대신 구매 인증 영역",
  (await u.getByRole('button', { name: '체험 완료 확인' }).count()) === 0 &&
    (await proofBox.count()) === 1,
)
await proofBox.getByLabel('주문번호').fill('2026110212345678')
await proofBox.getByLabel('실제 결제 금액(원)').fill('19900')
await proofBox.getByLabel(/주문 내역 캡처/).setInputFiles(image)
await proofBox.getByRole('button', { name: '구매 인증 제출' }).click()
// 제출하면 작업공간을 다시 불러오므로, 다시 열었을 때 인증 내용과 다음 안내가 보이는지 확인합니다.
await u.waitForTimeout(2000)
await openMine()
check(
  '구매 인증 제출(주문번호·환급 대기·다음 안내)',
  (await proofBox
    .getByText('2026110212345678')
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false)) &&
    (await proofBox.getByText('환급 대기').count()) > 0 &&
    (await u.getByText(/구매 인증이 완료되었습니다/).count()) > 0,
)
await u.waitForTimeout(1500)
await u.screenshot({ path: `${out}/purchase_3_proof.png`, fullPage: true })

// 6) 구매평 주소 제출
await openMine()
const sec = u.getByRole('region', { name: `신청 ${appId} 콘텐츠` })
await sec.getByLabel('게시 채널 1').selectOption('OTHER')
await sec
  .getByLabel('콘텐츠 URL 1')
  .fill('https://smartstore.naver.com/movrit-qa/products/1#review-qa')
await sec.getByRole('button', { name: '콘텐츠 제출' }).click()
await u.waitForTimeout(1500)
const afterSubmit = (
  await call(user, 'GET', '/campaigns/applications/mine')
).data.find((a) => String(a.id) === appId)
check('구매평 제출', afterSubmit?.status === 'CONTENT_SUBMITTED')

// 7) 업체 화면: 구매 인증 확인, 완료 전에는 환급 기록 버튼 없음
await b.goto(`${base}/seller/participants?campaignId=${campaignId}`, {
  waitUntil: 'networkidle',
})
await b
  .getByRole('button', { name: new RegExp(`신청 ${appId} 상세 보기`) })
  .click()
await b.waitForTimeout(1000)
const pay = b.getByRole('region', { name: '구매 인증과 환급' })
check(
  '업체 화면 구매 인증·캡처 표시',
  (await pay.getByText('2026110212345678').count()) > 0 &&
    (await pay
      .getByRole('img', { name: '주문 내역 캡처' })
      .waitFor({ timeout: 10000 })
      .then(() => true)
      .catch(() => false)),
)
check(
  '완료 전에는 환급 기록 버튼 없음',
  (await pay.getByRole('button', { name: '환급 완료로 기록' }).count()) === 0,
)
check(
  '완료 전 환급 기록 API 409',
  (await call(brand, 'PATCH', `/campaigns/applications/${appId}/payback`, {}))
    .status === 409,
)

// 8) 업체 검토 완료(화면) → 운영자 최종 승인(API)
await b.goto(`${base}/seller/contents`, { waitUntil: 'networkidle' })
const row = b.locator('tr', { hasText: 'QA-PURCHASE' }).first()
await row.getByRole('button', { name: '콘텐츠 검토' }).click()
await b.getByLabel('검토 결과').selectOption('approve')
await b.getByLabel(/검토 의견/).fill('구매평 확인했습니다.')
await b.getByRole('button', { name: '검토 결과 저장' }).click()
await b.waitForTimeout(1500)
const contents = (await call(admin, 'GET', '/admin/campaign-contents')).data
const items = Array.isArray(contents) ? contents : contents?.content || []
const target = items.find((s) => String(s.applicationId) === appId)
const approved = target
  ? await call(
      admin,
      'PATCH',
      `/admin/campaign-contents/${target.id}/approve`,
      {
        comment: '최종 승인합니다.',
        expectedVersion: target.version,
      },
    )
  : { status: 0 }
const done = (
  await call(user, 'GET', '/campaigns/applications/mine')
).data.find((a) => String(a.id) === appId)
check(
  '최종 승인 후 완료(COMPLETED)',
  approved.status === 200 && done?.status === 'COMPLETED',
)

// 9) 업체 환급 완료 기록 → 참여자 알림·화면
await b.goto(`${base}/seller/participants?campaignId=${campaignId}`, {
  waitUntil: 'networkidle',
})
await b
  .getByRole('button', { name: new RegExp(`신청 ${appId} 상세 보기`) })
  .click()
await b.waitForTimeout(1000)
await pay.getByRole('button', { name: '환급 완료로 기록' }).click()
await pay.getByLabel(/메모/).fill('11/2 계좌 이체 완료')
await pay.getByRole('button', { name: '환급 완료 기록' }).click()
check(
  '환급 완료 기록',
  await pay
    .getByText('환급 완료로 기록하고 참여자에게 알렸습니다.')
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false),
)
await b.screenshot({ path: `${out}/purchase_4_payback.png`, fullPage: true })
check(
  '환급 기록은 한 번만(409)',
  (await call(brand, 'PATCH', `/campaigns/applications/${appId}/payback`, {}))
    .status === 409,
)
const notes = (await call(user, 'GET', '/notifications')).data
const list = Array.isArray(notes) ? notes : notes?.content || []
check(
  '참여자 환급 알림',
  JSON.stringify(list.slice(0, 5)).includes('구매평 환급이 완료되었습니다'),
)
await openMine()
check(
  '참여자 화면 환급 완료 표시',
  (await proofBox.getByText('환급 완료').count()) > 0,
)
await u.screenshot({ path: `${out}/purchase_5_user_paid.png`, fullPage: true })

// 10) 권한: 다른 회원은 구매 인증을 볼 수 없음(404)
const other = await login('demo-creator@movrit.local').catch(() => null)
if (other)
  check(
    '다른 회원은 구매 인증 조회 불가',
    (
      await call(
        other,
        'GET',
        `/campaigns/applications/${appId}/purchase-proof`,
      )
    ).status === 404,
  )

console.log('페이지 오류:', [...b.errors, ...u.errors, ...guest.errors])
// 점검용 캠페인은 마감합니다(데이터는 보존).
await call(brand, 'PATCH', `/collaborations/campaigns/${campaignId}/close`)
await browser.close()
console.log(`\n결과: ${results.filter(Boolean).length}/${results.length} 통과`)
