// 참여 운영 기능을 실제 화면과 API로 확인합니다.
// 선정 전 신청 수정 · 일괄 선정/미선정 · 방문 예약 · 미제출/노쇼 패널티와 신청 제한 · 운영자 패널티 취소
// · 완료 참여자 평가 · 캠페인 복제 · 마감 알림(D-3) · 신고와 제재(가리기·경고·이용 정지와 복구)
// 준비: purchase-review-check.mjs 를 먼저 실행해 e2e/purchase-application-id.txt·purchase-campaign-id.txt 가 있어야 합니다.
// 점검용 캠페인만 만들고 끝나면 마감하며, 점검 계정의 패널티는 취소하고 정지는 되돌립니다.
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { api, base, call, login, openBrowser, pageAs } from './e2e-lib.mjs'

const brand = await login('demo-brand@movrit.local')
const userA = await login('demo-user@movrit.local')
let userB = await login('demo-creator@movrit.local')
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
    {
      encoding: 'utf8',
    },
  )
const pad = (n) => String(n).padStart(2, '0')
const local = (d, seconds = true) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}${seconds ? ':00' : ''}`
const now = new Date()
const hours = (h) => new Date(now.getTime() + h * 3600_000)
const stamp = local(now, false).replace('T', ' ')
const image = new URL(
  '../../public/assets/discovery/banners/review.png',
  import.meta.url,
).pathname
const created = []

// 대표 이미지를 올리고 configured API로 점검용 캠페인을 만듭니다.
async function createCampaign({
  title,
  type,
  fulfillment,
  recruit,
  details = {},
  questions = [],
}) {
  const body = new FormData()
  body.append(
    'file',
    new Blob([fs.readFileSync(image)], { type: 'image/png' }),
    'review.png',
  )
  const upload = await fetch(`${api}/campaign-image-assets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${brand.accessToken}` },
    body,
  })
  const asset = await upload.json()
  const res = await call(brand, 'POST', '/campaigns/configured', {
    campaign: {
      selectionMode: 'BRAND_DIRECT',
      title,
      description: '참여 운영 기능 점검용 캠페인입니다.',
      category: '뷰티',
      campaignType: type,
      region: type === 'LOCAL' ? '서울' : null,
      contentChannel: 'INSTAGRAM',
      recruitmentCount: recruit,
      rewardDescription: '점검용 제공 내역',
      startAt: local(hours(-1)),
      endAt: local(hours(2)),
      minFollowerCount: 0,
      details,
    },
    applicationForm: {
      allowedFulfillmentTypes: [fulfillment],
      questions,
      agreements: [],
    },
    requirementMode: 'NONE',
    requirement: null,
    presentation: {
      representativeAssetId: asset.assetId,
      detailImages: [],
      ...(fulfillment === 'VISIT'
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
  if (!res.data?.campaign?.id)
    throw new Error(
      `캠페인 생성 실패 ${res.status} ${JSON.stringify(res.data)}`,
    )
  created.push(res.data.campaign.id)
  return res.data.campaign.id
}
async function apply(user, campaignId, fulfillment, extra = {}) {
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
    ...extra,
  })
}
const appOf = async (user, campaignId) =>
  (await call(user, 'GET', '/campaigns/applications/mine')).data.find(
    (a) => String(a.campaignId) === String(campaignId),
  )
const notes = async (user) => {
  const data = (await call(user, 'GET', '/notifications')).data
  return Array.isArray(data) ? data : data?.content || []
}

// ───────── 준비: 배송형 D(모집 1명, 질문 1개) · 방문형 V(모집 1명) ─────────
const campaignD = await createCampaign({
  title: `[QA-OPS-D] 운영 점검 배송형 ${stamp}`,
  type: 'PRODUCT',
  fulfillment: 'DELIVERY',
  recruit: 1,
  questions: [
    {
      id: 'sns',
      label: '활동 SNS 주소',
      required: true,
      type: 'TEXT',
      options: [],
      maxLength: 200,
    },
  ],
})
const campaignV = await createCampaign({
  title: `[QA-OPS-V] 운영 점검 방문형 ${stamp}`,
  type: 'LOCAL',
  fulfillment: 'VISIT',
  recruit: 1,
})
// 사용자 B가 먼저, A가 나중에 신청합니다(목록은 최신 신청이 위라서 일괄 선정 때 A가 먼저 처리됩니다).
const answer = (value) => ({ answers: [{ questionId: 'sns', value }] })
await apply(userB, campaignD, 'DELIVERY', answer('https://instagram.com/qa_b'))
const appliedA = await apply(
  userA,
  campaignD,
  'DELIVERY',
  answer('https://instagram.com/qa_a'),
)
check('배송형 신청 2건 준비', appliedA.status === 201, String(appliedA.status))
await apply(userA, campaignV, 'VISIT')
const appDA = await appOf(userA, campaignD)
const appDB = await appOf(userB, campaignD)
const appVA = await appOf(userA, campaignV)

const browser = await openBrowser()
const ua = await pageAs(browser, userA)
const bp = await pageAs(browser, brand)
const openMine = async (titlePart) => {
  await ua.goto(`${base}/mypage/campaigns`, { waitUntil: 'networkidle' })
  await ua
    .getByRole('navigation', { name: '내 캠페인 선택' })
    .getByRole('button', { name: new RegExp(titlePart) })
    .first()
    .click()
  await ua.waitForTimeout(800)
}
const openParticipant = async (campaignId, appId) => {
  await bp.goto(`${base}/seller/participants?campaignId=${campaignId}`, {
    waitUntil: 'networkidle',
  })
  await bp
    .getByRole('button', { name: new RegExp(`신청 ${appId} 상세 보기`) })
    .click()
  await bp.waitForTimeout(1200)
}

// ───────── 1) 선정 전 신청 수정 ─────────
await openMine('QA-OPS-D')
const edit = ua.getByRole('region', { name: '신청 내용 수정' })
await edit.getByRole('button', { name: '신청 내용 고치기' }).click()
await edit
  .getByLabel('신청 메시지')
  .fill('수정한 신청 메시지입니다. 사진 위주로 올리겠습니다.')
await edit.getByLabel(/활동 SNS 주소/).fill('https://instagram.com/qa_a_new')
await edit.getByLabel('연락처').fill('010-1111-2222')
await edit.getByRole('button', { name: '고친 내용 저장' }).click()
await ua.waitForTimeout(1500)
const revised = await appOf(userA, campaignD)
check(
  '선정 전 신청 수정(메시지·답변·연락처)',
  revised.message.startsWith('수정한 신청 메시지') &&
    revised.answers[0].value === 'https://instagram.com/qa_a_new' &&
    revised.shippingContact.recipientPhone === '010-1111-2222',
)
check(
  '업체에 수정 알림',
  JSON.stringify((await notes(brand)).slice(0, 5)).includes(
    '신청 내용이 수정되었습니다',
  ),
)

// ───────── 2) 일괄 선정(모집 1명이라 1건 성공·1건 실패) → 일괄 미선정 ─────────
await bp.goto(`${base}/seller/participants?campaignId=${campaignD}`, {
  waitUntil: 'networkidle',
})
await bp.getByRole('checkbox', { name: '접수된 신청 모두 선택' }).check()
await bp.getByRole('button', { name: '일괄 선정' }).click()
await bp
  .getByRole('region', { name: '일괄 처리' })
  .getByRole('button', { name: '확정' })
  .click()
const bulkNotice = await bp
  .getByText(/선정 1건 완료, 1건은 처리하지 못했습니다/)
  .waitFor({ timeout: 10000 })
  .then(() => true)
  .catch(() => false)
check('일괄 선정 결과 안내(1건 성공·1건 실패 사유)', bulkNotice)
await bp.waitForTimeout(1500)
const afterSelect = [
  await appOf(userA, campaignD),
  await appOf(userB, campaignD),
].map((a) => a.status)
check(
  'A 선정(참여 중)·B 접수 유지',
  afterSelect[0] === 'ACTIVE' && afterSelect[1] === 'SUBMITTED',
  afterSelect.join(','),
)
await bp
  .getByRole('checkbox', { name: new RegExp(`신청 ${appDB.id} 선택`) })
  .check()
await bp.getByRole('button', { name: '일괄 미선정' }).click()
await bp
  .getByRole('region', { name: '일괄 처리' })
  .getByRole('button', { name: '확정' })
  .click()
await bp.waitForTimeout(2000)
check('일괄 미선정', (await appOf(userB, campaignD)).status === 'REJECTED')
await bp.screenshot({ path: './e2e/ops_bulk.png', fullPage: true })

// ───────── 3) 방문 예약: 요청 → 반려 → 재요청 → 확정 ─────────
await call(brand, 'PATCH', `/campaigns/applications/${appVA.id}/select`)
await openMine('QA-OPS-V')
const visit = ua.getByRole('region', { name: '방문 예약' })
await visit.getByLabel('방문 희망 일시').fill(local(hours(26), false))
await visit.getByLabel('인원').fill('2')
await visit.getByRole('button', { name: '방문 예약 요청' }).click()
check(
  '참여자 방문 예약 요청',
  await visit
    .getByText('확인 대기')
    .waitFor({ timeout: 8000 })
    .then(() => true)
    .catch(() => false),
)
await openParticipant(campaignV, appVA.id)
const sellerVisit = bp.getByRole('region', { name: '방문 예약' })
await sellerVisit.getByRole('button', { name: '다른 일시 요청' }).click()
await sellerVisit
  .getByLabel('반려 사유')
  .fill('그 시간은 예약이 꽉 찼습니다. 오후 3시로 부탁드립니다.')
await sellerVisit.getByRole('button', { name: '반려 보내기' }).click()
await bp.waitForTimeout(1200)
check(
  '참여자에게 다시 정해 달라는 알림',
  JSON.stringify((await notes(userA)).slice(0, 3)).includes(
    '방문 예약을 다시 정해 주세요',
  ),
)
await call(
  userA,
  'POST',
  `/campaigns/applications/${appVA.id}/visit-reservation`,
  {
    visitAt: local(hours(27)),
    partySize: 2,
    note: '오후 3시 방문',
  },
)
await openParticipant(campaignV, appVA.id)
await sellerVisit.getByRole('button', { name: '예약 확정' }).click()
check(
  '업체 예약 확정',
  await sellerVisit
    .getByText('확정', { exact: true })
    .waitFor({ timeout: 8000 })
    .then(() => true)
    .catch(() => false),
)

// ───────── 4) 노쇼 패널티: 확정한 방문 일시가 지난 뒤 ─────────
sql(
  `update campaign_visit_reservation set visit_at = now() - interval '2 hour' where application_id = ${appVA.id}`,
)
await openParticipant(campaignV, appVA.id)
const activity = bp.getByRole('region', { name: '참여자 활동과 평가' })
await activity.getByLabel('패널티 기록').selectOption('NO_SHOW')
await activity
  .getByLabel(/사유/)
  .fill('확정한 방문 일시에 연락 없이 방문하지 않았습니다.')
await activity.getByRole('button', { name: '노쇼 패널티 기록' }).click()
await bp.waitForTimeout(1500)
check(
  '노쇼 기록 후 참여 취소',
  (await appOf(userA, campaignV)).status === 'CANCELLED',
)

// ───────── 5) 미제출 패널티: 콘텐츠 마감이 지난 뒤 ─────────
sql(
  `update collaboration_campaign set content_submission_end_at = now() - interval '1 hour' where id = ${campaignD}`,
)
await openParticipant(campaignD, appDA.id)
await activity.getByLabel('패널티 기록').selectOption('NO_SUBMIT')
await activity
  .getByLabel(/사유/)
  .fill('콘텐츠 제출 마감이 지났는데 제출하지 않았습니다.')
await activity.getByRole('button', { name: '미제출 패널티 기록' }).click()
await bp.waitForTimeout(1500)
check(
  '미제출 기록 후 참여 취소',
  (await appOf(userA, campaignD)).status === 'CANCELLED',
)
const myActivity = (await call(userA, 'GET', '/members/me/activity')).data
check(
  '패널티 2회 → 신청 제한',
  myActivity.activePenaltyCount >= 2 && !!myActivity.restrictedUntil,
  String(myActivity.restrictedUntil),
)
const blocked = await call(
  userA,
  'POST',
  `/campaigns/${campaignV}/applications`,
  {
    message: '제한 확인',
    expectedFormVersion: 1,
    fulfillmentType: 'VISIT',
    answers: [],
    agreementAcceptances: [],
  },
)
check(
  '제한 중 신청은 409(패널티 안내)',
  blocked.status === 409 && String(blocked.data?.detail).includes('패널티'),
  blocked.data?.detail,
)
await ua.goto(`${base}/mypage`, { waitUntil: 'networkidle' })
check(
  '마이페이지 등급·신청 제한 표시',
  (await ua.getByRole('region', { name: '내 활동 등급' }).innerText()).includes(
    '신청할 수 없습니다',
  ),
)
await ua.screenshot({ path: './e2e/ops_mypage_grade.png' })

// ───────── 6) 운영자 패널티 취소(화면) → 제한 해제 ─────────
const ap = await pageAs(browser, admin)
await ap.goto(`${base}/admin/participation`, { waitUntil: 'networkidle' })
const penaltyRows = ap.locator('tr', { hasText: 'QA-OPS' })
await penaltyRows.first().getByRole('button', { name: '패널티 취소' }).click()
await ap.getByLabel('취소 사유').fill('점검용 기록이라 취소합니다.')
await ap.getByRole('button', { name: '취소 확정' }).click()
await ap.waitForTimeout(1500)
check(
  '운영자 패널티 취소 → 제한 해제',
  !(await call(userA, 'GET', '/members/me/activity')).data.restrictedUntil,
)

// ───────── 7) 완료 참여자 평가(구매평 점검 신청) ─────────
const doneApp = fs
  .readFileSync('./e2e/purchase-application-id.txt', 'utf8')
  .trim()
const doneCampaign = fs
  .readFileSync('./e2e/purchase-campaign-id.txt', 'utf8')
  .trim()
await openParticipant(doneCampaign, doneApp)
await activity.getByRole('radio', { name: '5점' }).click()
await activity
  .getByLabel(/브랜드 메모/)
  .fill('마감 전에 제출, 사진 품질이 좋음')
await activity.getByRole('button', { name: /평가 (저장|고치기)/ }).click()
await bp.waitForTimeout(1200)
const rated = (
  await call(
    brand,
    'GET',
    `/campaigns/applications/${doneApp}/participant-activity`,
  )
).data
check(
  '완료 참여자 평가 저장(5점·메모)',
  rated.myRating === 5 && rated.myMemo.includes('사진 품질'),
)
check(
  '참여자 본인 화면에는 평가 점수 없음',
  (await call(userA, 'GET', '/members/me/activity')).data.ratingAverage == null,
)

// ───────── 8) 캠페인 복제(구매평 캠페인) ─────────
await bp.goto(`${base}/seller/campaigns/new?copy=${doneCampaign}`, {
  waitUntil: 'networkidle',
})
await bp.getByText(/캠페인을 복사했습니다/).waitFor({ timeout: 15000 })
const copiedTitle = await bp.getByLabel('모집 제목').inputValue()
check(
  '복제: 제목·구매 안내·참여 방식·대표 이미지를 가져오고 기간은 비움',
  copiedTitle.startsWith('[복제] [QA-PURCHASE]') &&
    (await bp.getByLabel('구매처', { exact: true }).inputValue()) ===
      '네이버 스마트스토어' &&
    (await bp.getByRole('checkbox', { name: '직접 구매' }).isChecked()) &&
    (await bp.getByLabel('모집 시작 (한국시간)').inputValue()) === '' &&
    (await bp
      .locator('.campaign-media-fields, form')
      .getByText(/대표 이미지/)
      .count()) > 0,
  copiedTitle,
)
await bp.getByLabel('모집 제목').fill(`[QA-OPS-COPY] 복제 점검 ${stamp}`)
await bp.getByLabel('모집 시작 (한국시간)').fill(local(hours(-1), false))
await bp.getByLabel('모집 종료 (한국시간)').fill(local(hours(48), false))
await bp.getByRole('button', { name: '캠페인 등록' }).click()
const copySaved = await bp
  .getByRole('status')
  .filter({ hasText: '저장하고 다시 확인했습니다' })
  .waitFor({ timeout: 20000 })
  .then(() => true)
  .catch(async () => {
    console.log(await bp.locator('[role=alert]').allTextContents())
    return false
  })
const copy = (
  await call(brand, 'GET', '/collaborations/campaigns/seller')
).data.find((c) => c.title.startsWith('[QA-OPS-COPY]'))
if (copy) created.push(copy.id)
const copyInfo = copy
  ? await call(
      brand,
      'GET',
      `/collaborations/campaigns/${copy.id}/purchase-review`,
    )
  : { status: 0 }
check(
  '복제한 캠페인 등록(대표 이미지·구매 안내 포함)',
  copySaved && !!copy?.representativeImageUrl && copyInfo.status === 200,
)
await bp.screenshot({ path: './e2e/ops_copy.png', fullPage: true })

// ───────── 9) 마감 알림(D-3): 운영자 화면에서 바로 실행, 두 번째 실행은 중복 없음 ─────────
const campaignR = await createCampaign({
  title: `[QA-OPS-R] 마감 알림 점검 ${stamp}`,
  type: 'PRODUCT',
  fulfillment: 'DELIVERY',
  recruit: 1,
  details: { contentSubmissionEndAt: local(hours(50)) },
})
await apply(userB, campaignR, 'DELIVERY')
const appRB = await appOf(userB, campaignR)
await call(brand, 'PATCH', `/campaigns/applications/${appRB.id}/select`)
await ap.goto(`${base}/admin/participation`, { waitUntil: 'networkidle' })
await ap.getByRole('button', { name: '지금 확인해 보내기' }).click()
await ap.getByText(/마감 알림 \d+건을 보냈습니다/).waitFor({ timeout: 10000 })
const reminderNotes = (await notes(userB)).filter((n) =>
  String(n.title || n.message).includes('[D-3]'),
)
check(
  'D-3 마감 알림 도착',
  reminderNotes.some((n) => JSON.stringify(n).includes('QA-OPS-R')),
)
await call(admin, 'POST', '/admin/deadline-reminders/run')
// 이전 점검에서 만든 QA-OPS-R 캠페인 알림과 섞이지 않도록 이번 점검 캠페인 이름(시각 포함)으로 셉니다.
const again = (await notes(userB)).filter(
  (n) =>
    JSON.stringify(n).includes('[D-3]') &&
    JSON.stringify(n).includes(`마감 알림 점검 ${stamp}`),
)
check('같은 알림은 한 번만', again.length === 1, String(again.length))

// ───────── 10) 신고와 제재 ─────────
// 10-1) 커뮤니티 글 신고(화면) → 운영자 '가리기'(화면)
const post = (
  await call(userA, 'POST', '/community/posts', {
    board: 'free',
    category: '일상',
    title: `[점검] 신고 확인용 글 ${stamp}`,
    body: '신고와 가리기 처리를 확인하기 위한 점검용 글입니다.',
  })
).data
const ub = await pageAs(browser, userB)
await ub.goto(`${base}/community/free/${post.id}`, { waitUntil: 'networkidle' })
await ub.getByRole('button', { name: '커뮤니티 글 신고' }).click()
await ub.getByLabel('신고 사유').selectOption('SPAM')
await ub.getByLabel('신고 내용').fill('같은 글을 반복해서 올립니다.')
await ub.getByRole('button', { name: '신고하기' }).click()
check(
  '회원 글 신고 접수',
  await ub
    .getByText('신고 접수됨')
    .waitFor({ timeout: 8000 })
    .then(() => true)
    .catch(() => false),
)
const dup = await call(userB, 'POST', '/reports', {
  targetType: 'COMMUNITY_POST',
  targetId: post.id,
  reason: 'SPAM',
})
check('같은 글 중복 신고는 409', dup.status === 409)
check(
  '운영자에게 새 신고 알림',
  JSON.stringify((await notes(admin)).slice(0, 5)).includes(
    '새 신고가 접수되었습니다',
  ),
)
const reportId = (await call(admin, 'GET', '/admin/content-reports')).data.find(
  (r) => r.targetType === 'COMMUNITY_POST' && r.targetId === post.id,
).id
await ap.goto(`${base}/admin/moderation`, { waitUntil: 'networkidle' })
await ap.getByRole('button', { name: `신고 ${reportId} 보기` }).click()
await ap.getByLabel(/처리 메모/).fill('도배 글이라 가렸습니다.')
await ap.getByRole('button', { name: '가리기', exact: true }).click()
await ap.waitForTimeout(1500)
check(
  '가린 글은 공개 조회 안 됨',
  (await call(userB, 'GET', `/community/posts/${post.id}`)).status === 404,
)
check(
  '신고자·작성자에게 처리 알림',
  JSON.stringify((await notes(userB)).slice(0, 3)).includes(
    '신고하신 내용을 조치했습니다',
  ) &&
    JSON.stringify((await notes(userA)).slice(0, 3)).includes(
      '운영 정책에 따라 내용이 가려졌습니다',
    ),
)
await ap.screenshot({ path: './e2e/ops_moderation.png', fullPage: true })

// 10-2) 채팅 메시지 신고(업체) → 운영자 가리기 → 대화에 안내 문구로 보임
const room = (await call(brand, 'POST', `/chats/applications/${appVA.id}`)).data
const msg = (
  await call(userA, 'POST', `/chats/${room.id}/messages`, {
    body: `[점검] 신고 확인용 메시지 ${stamp}`,
  })
).data
check(
  '내 메시지는 신고 불가(400)',
  (
    await call(userA, 'POST', '/reports', {
      targetType: 'CHAT_MESSAGE',
      targetId: msg.id,
      reason: 'ABUSE',
    })
  ).status === 400,
)
const chatReport = (
  await call(brand, 'POST', '/reports', {
    targetType: 'CHAT_MESSAGE',
    targetId: msg.id,
    reason: 'ABUSE',
    detail: '점검',
  })
).data
await call(admin, 'PATCH', `/admin/content-reports/${chatReport.id}`, {
  action: 'HIDE',
  note: '점검',
})
const roomView = (await call(brand, 'GET', `/chats/${room.id}/messages`)).data
check(
  '가린 채팅 메시지는 안내 문구로 표시',
  roomView.messages.find((m) => m.id === msg.id)?.body ===
    '운영 정책에 따라 운영자가 가린 메시지입니다.',
)

// 10-3) 댓글 신고 → 이용 정지 → 로그인 불가 → 운영자가 정지 해제
const post2 = (
  await call(userA, 'POST', '/community/posts', {
    board: 'free',
    category: '일상',
    title: `[점검] 댓글 신고 확인용 글 ${stamp}`,
    body: '댓글 신고와 이용 정지 처리를 확인하기 위한 점검용 글입니다.',
  })
).data
const comment = (
  await call(userB, 'POST', `/community/posts/${post2.id}/comments`, {
    body: '점검용 댓글입니다.',
  })
).data
const commentReport = (
  await call(userA, 'POST', '/reports', {
    targetType: 'COMMUNITY_COMMENT',
    targetId: comment.id,
    reason: 'ABUSE',
  })
).data
const suspend = await call(
  admin,
  'PATCH',
  `/admin/content-reports/${commentReport.id}`,
  { action: 'SUSPEND', note: '점검용 정지' },
)
const loginBlocked = await fetch(`${api}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'demo-creator@movrit.local',
    password: process.env.MOVRIT_QA_PASSWORD,
  }),
})
check(
  '이용 정지 → 로그인 403',
  suspend.status === 200 && loginBlocked.status === 403,
)
await call(
  admin,
  'PATCH',
  `/members/admin/${suspend.data.targetMemberId}/status?status=ACTIVE`,
)
userB = await login('demo-creator@movrit.local')
check('운영자가 정지 해제 → 다시 로그인', !!userB.accessToken)
// 점검용 글은 지웁니다(가린 글 포함, 작성자 삭제).
await call(userA, 'DELETE', `/community/posts/${post2.id}`)

// ───────── 정리: 점검 캠페인 마감, 남은 패널티 취소 ─────────
for (const id of created)
  await call(brand, 'PATCH', `/collaborations/campaigns/${id}/close`)
const penalties = (await call(admin, 'GET', '/admin/penalties')).data.filter(
  (p) => p.active && String(p.campaignTitle).includes('QA-OPS'),
)
for (const p of penalties)
  await call(admin, 'PATCH', `/admin/penalties/${p.id}/revoke`, {
    reason: '점검 종료 정리',
  })
check(
  '정리: 점검 패널티 모두 취소',
  !(await call(userA, 'GET', '/members/me/activity')).data.restrictedUntil,
)

console.log('페이지 오류:', [
  ...ua.errors,
  ...bp.errors,
  ...ap.errors,
  ...ub.errors,
])
await browser.close()
console.log(`\n결과: ${results.filter(Boolean).length}/${results.length} 통과`)
