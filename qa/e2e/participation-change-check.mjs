// 참여 조정 기능을 API로 확인합니다(화면 점검은 아래 UI 단계에서 이어집니다).
// 신청 철회 · 참여 취소(단순·협의+증빙) · 기간 연장 · 마감 지난 미제출 자동 취소 · 취소 횟수 · 업체 미선정 · 방문형 선착순
// 점검용 캠페인만 만들고 끝나면 마감하며, 점검 계정에 생긴 패널티는 취소합니다.
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { api, base, call, login, openBrowser, pageAs } from './e2e-lib.mjs'
import { local, hoursFromNow } from './fixtures.mjs'

const brand = await login('demo-brand@movrit.local')
const userA = await login('demo-user@movrit.local')
const userB = await login('demo-creator@movrit.local')
const admin = await login('demo-admin@movrit.local')
const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`)
}
const sql = (query) =>
  execFileSync(
    '/private/tmp/movrit-tools/sql.sh',
    ['movrit_integration', query],
    { encoding: 'utf8' },
  )
const stamp = local(new Date(), false).replace('T', ' ')
const image = new URL(
  '../../public/assets/discovery/banners/review.png',
  import.meta.url,
).pathname
const created = []
// 이전 점검에서 정리하지 못한 점검 캠페인(QA-CHG)은 먼저 마감합니다.
for (const c of (await call(brand, 'GET', '/collaborations/campaigns/seller'))
  .data)
  if (c.open && String(c.title).startsWith('[QA-CHG-'))
    await call(brand, 'PATCH', `/collaborations/campaigns/${c.id}/close`)

async function createCampaign({
  title,
  fulfillment = 'DELIVERY',
  recruit = 2,
  selectionMode = 'BRAND_DIRECT',
  expectFailure = false,
}) {
  const body = new FormData()
  body.append(
    'file',
    new Blob([fs.readFileSync(image)], { type: 'image/png' }),
    'review.png',
  )
  const asset = await (
    await fetch(`${api}/campaign-image-assets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${brand.accessToken}` },
      body,
    })
  ).json()
  const visit = fulfillment === 'VISIT'
  const res = await call(brand, 'POST', '/campaigns/configured', {
    campaign: {
      selectionMode,
      title,
      description: '참여 조정 기능 점검용 캠페인입니다.',
      category: '뷰티',
      campaignType: visit ? 'LOCAL' : 'PRODUCT',
      region: visit ? '서울' : null,
      contentChannel: 'INSTAGRAM',
      recruitmentCount: recruit,
      rewardDescription: '점검용 제공 내역',
      startAt: local(hoursFromNow(-1)),
      endAt: local(hoursFromNow(2)),
      minFollowerCount: 0,
      details: {
        experienceStartAt: local(hoursFromNow(3)),
        experienceEndAt: local(hoursFromNow(48)),
        contentSubmissionEndAt: local(hoursFromNow(72)),
      },
    },
    applicationForm: {
      allowedFulfillmentTypes: [fulfillment],
      questions: [],
      agreements: [],
    },
    requirementMode: 'NONE',
    requirement: null,
    presentation: {
      representativeAssetId: asset.assetId,
      detailImages: [],
      ...(visit
        ? {
            visitLocation: {
              venueName: 'MOVRIT 점검 매장',
              postalCode: '04524',
              address1: '서울특별시 중구 세종대로 110',
              address2: '1층',
            },
          }
        : {}),
    },
  })
  if (expectFailure) return res
  if (!res.data?.campaign?.id)
    throw new Error(
      `캠페인 생성 실패 ${res.status} ${JSON.stringify(res.data)}`,
    )
  created.push(res.data.campaign.id)
  return res.data.campaign.id
}
async function apply(user, campaignId, fulfillment = 'DELIVERY') {
  const form = (
    await call(user, 'GET', `/campaigns/${campaignId}/application-form`)
  ).data
  return call(user, 'POST', `/campaigns/${campaignId}/applications`, {
    message: '점검용 신청입니다. 성실히 참여하겠습니다.',
    expectedFormVersion: form.version,
    expectedEligibilityRequirementId: null,
    expectedEligibilityRequirementVersion: null,
    fulfillmentType: fulfillment,
    shippingContact:
      fulfillment === 'DELIVERY'
        ? {
            recipientName: '점검사용자',
            recipientPhone: '010-0000-0000',
            postalCode: '04524',
            address1: '서울특별시 중구 세종대로 110',
          }
        : null,
    answers: [],
    agreementAcceptances: [],
  })
}
const appOf = async (user, campaignId) =>
  (await call(user, 'GET', '/campaigns/applications/mine')).data.find(
    (a) => String(a.campaignId) === String(campaignId),
  )
const changes = async (user, appId) =>
  (await call(user, 'GET', `/campaigns/applications/${appId}/changes`)).data
const notes = async (user) => {
  const data = (await call(user, 'GET', '/notifications')).data
  return Array.isArray(data) ? data : data?.content || []
}
const activityCount = async (user) =>
  (await call(user, 'GET', '/members/me/activity')).data.cancelCount

// ───────── 1) 선정 발표 전 신청 철회(횟수 없음) ─────────
const cW = await createCampaign({ title: `[QA-CHG-W] 신청 철회 점검 ${stamp}` })
await apply(userA, cW)
const appW = await appOf(userA, cW)
const beforeCount = await activityCount(userA)
check('철회 가능 표시', (await changes(userA, appW.id)).canWithdraw)
const withdrawn = await call(
  userA,
  'POST',
  `/campaigns/applications/${appW.id}/withdraw`,
  { reason: '일정이 맞지 않습니다.' },
)
check(
  '신청 철회 → 취소 상태, 횟수 그대로',
  withdrawn.status === 200 &&
    withdrawn.data.status === 'CANCELLED' &&
    (await activityCount(userA)) === beforeCount,
  `${withdrawn.status} ${beforeCount}→${await activityCount(userA)}`,
)

// ───────── 2) 선정 후 단순 참여 취소(횟수 +1) ─────────
const cS = await createCampaign({ title: `[QA-CHG-S] 참여 취소 점검 ${stamp}` })
await apply(userA, cS)
const appS = await appOf(userA, cS)
await call(brand, 'PATCH', `/campaigns/applications/${appS.id}/select`)
check(
  '선정 후에는 철회 불가(400·409)',
  [400, 409].includes(
    (
      await call(userA, 'POST', `/campaigns/applications/${appS.id}/withdraw`, {
        reason: '확인',
      })
    ).status,
  ),
)
const selfCancel = await call(
  userA,
  'POST',
  `/campaigns/applications/${appS.id}/self-cancel`,
  { reason: '개인 사정으로 참여가 어렵습니다.' },
)
check(
  '단순 참여 취소 → 취소 횟수 +1',
  selfCancel.status === 200 &&
    (await activityCount(userA)) === ((beforeCount + 1) % 5 || 0),
  `${selfCancel.status} ${await activityCount(userA)}`,
)
check(
  '업체에 참여 취소 알림',
  JSON.stringify((await notes(brand)).slice(0, 5)).includes('QA-CHG-S'),
)

// ───────── 3) 협의 취소(증빙) → 운영자 승인(횟수 없음) ─────────
const cA = await createCampaign({ title: `[QA-CHG-A] 협의 취소 점검 ${stamp}` })
await apply(userA, cA)
const appA = await appOf(userA, cA)
await call(brand, 'PATCH', `/campaigns/applications/${appA.id}/select`)
const evidence = new FormData()
evidence.append(
  'reason',
  new Blob(['업체와 협의해 취소하기로 했습니다.'], { type: 'text/plain' }),
)
evidence.append(
  'evidence',
  new Blob([fs.readFileSync(image)], { type: 'image/png' }),
  'chat.png',
)
const agreed = await fetch(
  `${api}/campaigns/applications/${appA.id}/cancel-requests`,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.accessToken}` },
    body: evidence,
  },
)
check('협의 취소 요청 접수', agreed.status === 200, String(agreed.status))
const dupAgreed = await fetch(
  `${api}/campaigns/applications/${appA.id}/cancel-requests`,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${userA.accessToken}` },
    body: evidence,
  },
)
check(
  '진행 중인 요청이 있으면 다시 요청 불가',
  dupAgreed.status === 409,
  String(dupAgreed.status),
)
const pending = (await call(admin, 'GET', '/admin/cancel-requests')).data.find(
  (r) => r.applicationId === appA.id,
)
check(
  '운영자 목록에 요청 표시',
  pending?.status === 'REQUESTED',
  pending?.status,
)
check(
  '운영자에게 협의 취소 알림',
  JSON.stringify((await notes(admin)).slice(0, 5)).includes(
    'ADMIN_CANCEL_REQUEST',
  ),
)
const evidenceAdmin = await fetch(
  `${api}/cancel-requests/${pending.id}/evidence`,
  {
    headers: { Authorization: `Bearer ${admin.accessToken}` },
  },
)
const evidenceOther = await fetch(
  `${api}/cancel-requests/${pending.id}/evidence`,
  {
    headers: { Authorization: `Bearer ${userB.accessToken}` },
  },
)
check(
  '증빙 이미지는 운영자·업체·본인만(다른 회원 404)',
  evidenceAdmin.status === 200 && evidenceOther.status === 404,
  `${evidenceAdmin.status}/${evidenceOther.status}`,
)
const countBeforeAgreed = await activityCount(userA)
const approved = await call(
  admin,
  'PATCH',
  `/admin/cancel-requests/${pending.id}`,
  {
    approve: true,
    note: '업체 확인 완료',
  },
)
check(
  '협의 취소 승인 → 취소, 횟수 그대로',
  approved.data?.status === 'APPROVED' &&
    (await appOf(userA, cA)).status === 'CANCELLED' &&
    (await activityCount(userA)) === countBeforeAgreed,
)

// ───────── 4) 기간 연장 요청 → 업체 승인 ─────────
const cE = await createCampaign({ title: `[QA-CHG-E] 기간 연장 점검 ${stamp}` })
await apply(userB, cE)
const appE = await appOf(userB, cE)
await call(brand, 'PATCH', `/campaigns/applications/${appE.id}/select`)
const beforeDeadline = (await changes(userB, appE.id)).contentDeadline
check(
  '연장은 7·14일만(3일은 400)',
  (
    await call(userB, 'POST', `/campaigns/applications/${appE.id}/extension`, {
      days: 3,
      reason: '확인',
    })
  ).status === 400,
)
const ext = await call(
  userB,
  'POST',
  `/campaigns/applications/${appE.id}/extension`,
  { days: 7, reason: '촬영 장소 섭외가 늦어졌습니다.' },
)
check(
  '연장 요청 접수',
  ext.status === 200 && ext.data.extension?.status === 'REQUESTED',
)
const sellerList = (await call(brand, 'GET', '/campaigns/extension-requests'))
  .data
check(
  '업체 연장 요청 목록',
  sellerList.some((e) => e.applicationId === appE.id),
)
const decided = await call(
  brand,
  'PATCH',
  `/campaigns/applications/${appE.id}/extension`,
  { approve: true },
)
const afterExt = await changes(userB, appE.id)
const diffDays =
  (new Date(afterExt.contentDeadline) - new Date(beforeDeadline)) / 86400_000
check(
  '연장 승인 → 이 신청 콘텐츠 마감 7일 뒤로',
  decided.data?.status === 'APPROVED' && Math.round(diffDays) === 7,
  `${beforeDeadline} → ${afterExt.contentDeadline}`,
)
check('연장은 신청당 1회', !afterExt.canRequestExtension)
const experienceDiff =
  (new Date(afterExt.experienceExtendedUntil) - hoursFromNow(48)) / 86400_000
check(
  '연장 승인 → 체험 기간도 7일 늘어남',
  Math.round(experienceDiff) === 7,
  String(afterExt.experienceExtendedUntil),
)

// ───────── 5) 마감 지난 미제출 자동 취소 · 6) 업체 미선정 ─────────
const cM = await createCampaign({
  title: `[QA-CHG-M] 미제출 자동 처리 점검 ${stamp}`,
})
await apply(userB, cM)
const appM = await appOf(userB, cM)
await call(brand, 'PATCH', `/campaigns/applications/${appM.id}/select`)
sql(
  `update collaboration_campaign set content_submission_end_at = now() - interval '1 hour' where id = ${cM}`,
)
const cU = await createCampaign({
  title: `[QA-CHG-U] 미선정 기록 점검 ${stamp}`,
})
await apply(userB, cU)
sql(
  `update collaboration_campaign set end_at = now() - interval '1 hour', selection_announced_at = now() - interval '30 minute' where id = ${cU}`,
)
const bCountBefore = await activityCount(userB)
const job = await call(admin, 'POST', '/admin/participation-jobs/run')
check(
  '예약 작업 바로 실행',
  job.status === 200 && job.data.missedDeadlineCancelled >= 1,
  JSON.stringify(job.data),
)
check(
  '미제출 자동 취소 + 취소 횟수 기록',
  (await appOf(userB, cM)).status === 'CANCELLED' &&
    (await activityCount(userB)) !== bCountBefore,
  `${bCountBefore}→${await activityCount(userB)}`,
)
check('연장 승인된 신청은 그대로', (await appOf(userB, cE)).status === 'ACTIVE')
const mineUnselected = (
  await call(brand, 'GET', '/sellers/me/unselected-campaigns')
).data
check(
  '업체 미선정 기록',
  mineUnselected.records.some((r) => r.campaignId === cU),
  `count ${mineUnselected.count}`,
)
const again = await call(admin, 'POST', '/admin/participation-jobs/run')
check(
  '두 번째 실행은 중복 없음',
  again.data.missedDeadlineCancelled === 0 &&
    (
      await call(brand, 'GET', '/sellers/me/unselected-campaigns')
    ).data.records.filter((r) => r.campaignId === cU).length === 1,
  JSON.stringify(again.data),
)

// ───────── 7) 방문형 선착순: 신청 즉시 선정, 정원 차면 409 ─────────
const cF = await createCampaign({
  title: `[QA-CHG-F] 선착순 방문 점검 ${stamp}`,
  fulfillment: 'VISIT',
  recruit: 1,
  selectionMode: 'FIRST_COME',
})
const first = await apply(userB, cF, 'VISIT')
const firstApp = await appOf(userB, cF)
check(
  '선착순 신청 즉시 선정',
  first.status === 201 && ['SELECTED', 'ACTIVE'].includes(firstApp?.status),
  `${first.status} ${firstApp?.status}`,
)
const full = await apply(userA, cF, 'VISIT')
check(
  '정원이 차면 409',
  full.status === 409 && String(full.data?.detail).includes('선착순'),
  `${full.status} ${full.data?.detail}`,
)
const deliveryFirstCome = await createCampaign({
  title: `[QA-CHG-FX] 선착순 배송형 거절 점검 ${stamp}`,
  selectionMode: 'FIRST_COME',
  expectFailure: true,
})
if (deliveryFirstCome.data?.campaign?.id)
  created.push(deliveryFirstCome.data.campaign.id)
check(
  '선착순은 방문형만(배송형 거절)',
  deliveryFirstCome.status === 400,
  `${deliveryFirstCome.status} ${deliveryFirstCome.data?.detail}`,
)

// ───────── 화면 확인 ─────────
const browser = await openBrowser()
const ua = await pageAs(browser, userB)
await ua.goto(`${base}/mypage/campaigns`, { waitUntil: 'networkidle' })
await ua
  .getByRole('navigation', { name: '내 캠페인 선택' })
  .getByRole('button', { name: /QA-CHG-E/ })
  .first()
  .click()
await ua.waitForTimeout(800)
const changeRegion = ua.getByRole('region', { name: '참여 조정' })
check(
  '내 캠페인: 연장된 마감 표시',
  (await changeRegion.innerText().catch(() => '')).includes('연장'),
)
check(
  '내 캠페인: 참여 일정에도 연장된 마감 반영',
  (await ua.locator('.campaign-workspace__deadline').innerText()).includes(
    '연장 승인됨',
  ),
)
await ua.screenshot({ path: './e2e/chg_mine.png', fullPage: true })
await ua.getByRole('tab', { name: '달력' }).click()
check(
  '내 캠페인: 월 달력',
  await ua
    .getByRole('grid', { name: /달력/ })
    .waitFor({ timeout: 5000 })
    .then(() => true)
    .catch(() => false),
)
await ua.screenshot({ path: './e2e/chg_calendar.png', fullPage: true })
const ap = await pageAs(browser, admin)
await ap.goto(`${base}/admin/participation`, { waitUntil: 'networkidle' })
const adminText = await ap.locator('main').innerText()
check(
  '운영자 협의 취소·업체 미선정 화면',
  adminText.includes('QA-CHG-A') && adminText.includes('QA-CHG-U'),
)
await ap.screenshot({ path: './e2e/chg_admin.png', fullPage: true })
const bp = await pageAs(browser, brand)
await bp.goto(`${base}/seller/participants?campaignId=${cE}`, {
  waitUntil: 'networkidle',
})
check(
  '업체 참여자 화면: 연장 요청 내역',
  (await bp.locator('main').innerText()).includes('연장'),
)
await bp.screenshot({ path: './e2e/chg_seller.png', fullPage: true })
// 캠페인 작성: 선착순을 고르면 지역(방문형)·방문 참여로 맞추고, 채널을 고르면 기본 요건이 빈 칸에 자동으로 채워집니다(저장하지 않음).
await bp.goto(`${base}/seller/campaigns/new`, { waitUntil: 'networkidle' })
await bp.getByLabel('선정 방식').selectOption('FIRST_COME')
await bp.getByLabel('콘텐츠 채널').selectOption('BLOG')
check(
  '작성 화면: 선착순 → 방문형·방문 참여, 채널을 고르면 기본 요건 자동 채움',
  (await bp.getByLabel('캠페인 종류').inputValue()) === 'LOCAL' &&
    (await bp.getByRole('checkbox', { name: /방문/ }).first().isChecked()) &&
    (await bp.getByLabel('제출 요구사항').inputValue()).includes('1,000자'),
)
await bp.screenshot({ path: './e2e/chg_editor.png', fullPage: true })

// ───────── 정리 ─────────
for (const id of created)
  await call(brand, 'PATCH', `/collaborations/campaigns/${id}/close`)
const penalties = (await call(admin, 'GET', '/admin/penalties')).data.filter(
  (p) => p.active && p.type === 'CANCEL_LIMIT',
)
for (const p of penalties)
  await call(admin, 'PATCH', `/admin/penalties/${p.id}/revoke`, {
    reason: '점검 종료 정리',
  })
console.log('페이지 오류:', [...ua.errors, ...ap.errors, ...bp.errors])
await browser.close()
console.log(`\n결과: ${results.filter(Boolean).length}/${results.length} 통과`)
