// QA 4건 점검(실제 서버, 점검용 계정·캠페인만 사용)
//  1) 정원 경합: 모집 1명 캠페인에 두 신청을 동시에 선정 → 한 건만 성공해야 합니다.
//  2) 다른 브랜드 권한: 다른 업체 계정이 남의 캠페인·신청·콘텐츠를 보거나 바꿀 수 없어야 합니다.
//  3) 배송 정보 중복(QA-AUDIT-005): 업체 참여자 상세에 배송 정보가 한 번만 보여야 합니다.
//  4) 스냅샷 보존: 신청 뒤 신청서 양식·캠페인 안내를 고쳐도 지난 신청 내용은 그대로여야 합니다.
import fs from 'node:fs'
import {
  api,
  base,
  call,
  login,
  openBrowser,
  pageAs,
  password,
} from './e2e-lib.mjs'

const campaignId = fs.readFileSync('./e2e/campaign-id.txt', 'utf8').trim()
const appA = fs.readFileSync('./e2e/qa-app-a.txt', 'utf8').trim()
const appB = fs.readFileSync('./e2e/qa-app-b.txt', 'utf8').trim()
const brand = await login('claude-design-brand@movrit.local')
const admin = await login('claude-e2e-admin@movrit.local')
const userA = await login('claude-e2e-user@movrit.local')
const results = []
const check = (name, ok, detail = '') => {
  results.push([name, ok])
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`)
}

// ── 1) 정원 경합 ──
const [r1, r2] = await Promise.all([
  call(brand, 'PATCH', `/campaigns/applications/${appA}/select`),
  call(brand, 'PATCH', `/campaigns/applications/${appB}/select`),
])
const codes = [r1.status, r2.status].sort()
check(
  '동시 선정 시 한 건만 성공(200 + 409)',
  codes[0] === 200 && codes[1] === 409,
  `응답 ${codes.join(', ')}`,
)
const sellerApps = (
  await call(brand, 'GET', '/campaigns/applications/seller')
).data.filter((a) => String(a.campaignId) === campaignId)
// 선정하면 바로 참여 중(ACTIVE)이 되므로 두 상태를 함께 셉니다.
const selected = sellerApps.filter((a) =>
  ['SELECTED', 'ACTIVE'].includes(a.status),
).length
check(
  '선정 인원이 모집 인원(1명)을 넘지 않음',
  selected === 1,
  `선정 ${selected}명`,
)
const loser = r1.status === 200 ? appB : appA
const again = await call(
  brand,
  'PATCH',
  `/campaigns/applications/${loser}/select`,
)
check(
  '정원이 찬 뒤 추가 선정 요청도 거절',
  again.status === 409,
  `응답 ${again.status} ${again.data?.detail || ''}`,
)

// ── 2) 다른 브랜드 권한 ──
// 점검용 두 번째 업체 계정을 준비합니다(이미 있으면 그대로 사용).
await fetch(`${api}/members/signup`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'claude-e2e-brand2@movrit.local',
    password,
    name: '타브랜드점검',
    nickname: '타브랜드점검',
    phone: '',
  }),
})
let brand2 = await login('claude-e2e-brand2@movrit.local')
await call(brand2, 'POST', '/sellers/apply', {
  businessName: 'QA 타브랜드',
  brandName: 'QA OTHER',
  businessNumber: 'QA-OTHER-0001',
  representativeName: '점검',
})
const sellers = (await call(admin, 'GET', '/admin/sellers')).data
const seller2 = sellers.find((s) => s.businessName === 'QA 타브랜드')
if (seller2?.status === 'PENDING')
  await call(admin, 'PATCH', `/admin/sellers/${seller2.id}/approve`)
brand2 = await login('claude-e2e-brand2@movrit.local')
if (!(await call(brand2, 'GET', '/brands/mine')).data?.length)
  await call(brand2, 'POST', '/brands', {
    name: 'QA OTHER',
    description: '권한 점검용 다른 브랜드',
  })
const winner = r1.status === 200 ? appA : appB
const before = (
  await call(brand, 'GET', `/campaigns/applications/${winner}/seller-detail`)
).data
const denied = async (label, method, path, body) => {
  const r = await call(brand2, method, path, body)
  check(
    `다른 브랜드: ${label} 거절`,
    [403, 404].includes(r.status),
    `응답 ${r.status}`,
  )
}
await denied(
  '신청 상세 보기',
  'GET',
  `/campaigns/applications/${winner}/seller-detail`,
)
await denied('선정', 'PATCH', `/campaigns/applications/${loser}/select`)
await denied('미선정 처리', 'PATCH', `/campaigns/applications/${loser}/reject`)
await denied(
  '신청서 양식 수정',
  'PUT',
  `/campaigns/${campaignId}/application-form`,
  { allowedFulfillmentTypes: ['DELIVERY'], questions: [], agreements: [] },
)
await denied(
  '캠페인 마감',
  'PATCH',
  `/collaborations/campaigns/${campaignId}/close`,
)
const contents = (await call(admin, 'GET', '/admin/campaign-contents')).data
const someContent = contents.find(
  (c) => c.status === 'APPROVED' || c.status === 'BRAND_APPROVED',
)
if (someContent)
  await denied(
    '콘텐츠 검토',
    'PATCH',
    `/campaign-contents/${someContent.id}/approve`,
    { comment: null, expectedVersion: someContent.version },
  )
const list2 = (await call(brand2, 'GET', '/campaigns/applications/seller')).data
check(
  '다른 브랜드의 신청 목록에 남의 신청이 없음',
  Array.isArray(list2) &&
    !list2.some((a) => String(a.campaignId) === campaignId),
  `${list2?.length ?? '?'}건`,
)
const userTry = await call(
  userA,
  'PATCH',
  `/campaigns/applications/${loser}/select`,
)
check(
  '일반 사용자: 선정 요청 거절',
  [403, 404].includes(userTry.status),
  `응답 ${userTry.status}`,
)
const adminTry = await call(
  admin,
  'PATCH',
  `/admin/campaign-applications/${loser}/select`,
)
check(
  '운영자: 업체 직접 선정 캠페인은 선정할 수 없음',
  [403, 409].includes(adminTry.status),
  `응답 ${adminTry.status}`,
)
const after = (
  await call(brand, 'GET', `/campaigns/applications/${winner}/seller-detail`)
).data
check(
  '거절된 요청 뒤 신청 상태 그대로',
  before?.application?.status === after?.application?.status ||
    JSON.stringify(before?.status) === JSON.stringify(after?.status),
)

// ── 4) 스냅샷 보존 ──
const mineBefore = (
  await call(userA, 'GET', '/campaigns/applications/mine')
).data.find((a) => String(a.campaignId) === campaignId)
const formBefore = (
  await call(brand, 'GET', `/campaigns/${campaignId}/application-form`)
).data
const formSave = await call(
  brand,
  'PUT',
  `/campaigns/${campaignId}/application-form`,
  {
    allowedFulfillmentTypes: ['DELIVERY', 'VISIT'],
    questions: [
      {
        id: 'q-new',
        label: '새로 추가한 질문',
        type: 'TEXT',
        required: true,
        options: [],
        maxLength: 100,
      },
    ],
    agreements: [
      {
        id: 'a-new',
        title: '새 동의 문서',
        version: 'v2',
        body: '내용',
        required: true,
      },
    ],
  },
)
check(
  '신청 이후 양식 수정 요청',
  [200, 409].includes(formSave.status),
  `응답 ${formSave.status}${formSave.data?.detail ? ' ' + formSave.data.detail : ''}`,
)
const mineAfter = (
  await call(userA, 'GET', '/campaigns/applications/mine')
).data.find((a) => String(a.campaignId) === campaignId)
const same = (k) =>
  JSON.stringify(mineBefore?.[k]) === JSON.stringify(mineAfter?.[k])
check(
  '신청 당시 양식 버전 유지',
  same('formVersion'),
  `${mineBefore?.formVersion} → ${mineAfter?.formVersion} (현재 양식 v${formSave.data?.version ?? formBefore?.version})`,
)
check(
  '신청 당시 답변·동의 유지',
  same('answers') && same('agreementAcceptances'),
)
check(
  '신청 당시 배송 정보 유지',
  same('shippingContact') && same('fulfillmentType'),
)
check(
  '신청 당시 참여 조건 스냅샷 유지',
  same('eligibilityRequirementSnapshot') &&
    same('eligibilityRequirementVersion'),
)

// ── 3) 배송 정보 중복(QA-AUDIT-005) ──
// 연락처가 공개된(완료) 배송형 신청의 업체 상세에서 받는 사람·주소가 한 번씩만 보여야 합니다.
const done = (
  await call(brand, 'GET', '/campaigns/applications/seller')
).data.find(
  (a) =>
    a.status === 'COMPLETED' &&
    a.fulfillmentType === 'DELIVERY' &&
    a.shippingContact,
)
const browser = await openBrowser()
const page = await pageAs(browser, brand)
if (done) {
  await page.goto(`${base}/seller/participants?campaignId=${done.campaignId}`, {
    waitUntil: 'networkidle',
  })
  await page
    .getByRole('button', { name: new RegExp(`신청 ${done.id} 상세 보기`) })
    .click()
  await page
    .getByText(done.shippingContact.address1)
    .first()
    .waitFor({ timeout: 10000 })
  const text = await page.locator('body').innerText()
  const times = (value) => text.split(value).length - 1
  check(
    '업체 참여자 상세: 배송 정보 1회 표시',
    times(done.shippingContact.recipientName) === 1 &&
      times(done.shippingContact.address1) === 1,
    `받는 사람 ${times(done.shippingContact.recipientName)}회, 주소 ${times(done.shippingContact.address1)}회`,
  )
  await page.screenshot({
    path: './e2e/brand_participant_shipping.png',
    fullPage: true,
  })
} else {
  check(
    '업체 참여자 상세: 배송 정보 1회 표시',
    false,
    '완료된 배송형 신청이 없어 확인하지 못했습니다',
  )
}
console.log('페이지 오류:', page.errors)
await browser.close()
console.log(
  `\n결과: ${results.filter((r) => r[1]).length}/${results.length} 통과`,
)
