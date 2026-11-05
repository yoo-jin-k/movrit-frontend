// 네이버 블로그 일평균 방문자 조건을 처음부터 끝까지 확인합니다.
// 운영자 조건 설정 → 참여자 '지금 확인'(실제 네이버 방문자 위젯) → 미달·하루 지남·직접 입력 차단 → 기준 조정 후 신청
// → 신청 당시 값 저장 → 업체 상세 공개 범위 → 운영자 조건 해제까지 봅니다.
// 실행 전 참여자 계정(VISITOR_USER, 기본 junho@movrit.local)이 설정에서 네이버 블로그를 '확인됨'으로 연결해 두어야 하고,
// 그 블로그의 방문자 위젯이 켜져 있어야 합니다. 점검 캠페인은 제목이 '[점검]'으로 시작하므로 정리 스크립트로 지울 수 있습니다.
import { execFileSync } from 'node:child_process'
import { base, call, login, openBrowser, pageAs } from './e2e-lib.mjs'
import { createCampaign } from './fixtures.mjs'

const brand = await login('demo-brand@movrit.local')
const admin = await login('demo-admin@movrit.local')
const user = await login(process.env.VISITOR_USER || 'junho@movrit.local')
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
const eligibility = async (id) =>
  (await call(user, 'GET', `/campaigns/${id}/eligibility`)).data

// 1. 점검 캠페인을 만들고 운영자가 방문자 조건을 정합니다.
const campaignId = await createCampaign(brand, {
  title: '[점검] 블로그 방문자 조건',
  recruit: 3,
})
check('점검 캠페인 생성', Boolean(campaignId), `#${campaignId}`)
const requirementPath = `/admin/campaigns/${campaignId}/eligibility-requirement`
let saved = await call(admin, 'PUT', requirementPath, {
  channelType: 'NAVER_BLOG',
  metricType: 'DAILY_VISITORS',
  minimumValue: 1,
  measurementPeriod: null,
  expectedVersion: null,
})
check(
  '운영자 방문자 조건 설정(기간은 서버가 최근 4일 평균으로 채움)',
  saved.status === 200 && saved.data.measurementPeriod === 'RECENT_4_DAYS',
  `${saved.status} 최소 ${saved.data?.minimumValue}`,
)
const wrongPeriod = await call(admin, 'PUT', requirementPath, {
  channelType: 'NAVER_BLOG',
  metricType: 'DAILY_VISITORS',
  minimumValue: 1,
  measurementPeriod: 'MONTHLY',
  expectedVersion: saved.data.version,
})
check('다른 집계 기간은 거절', wrongPeriod.status === 400, `${wrongPeriod.status}`)
const userTry = await call(user, 'PUT', requirementPath, {
  channelType: 'NAVER_BLOG',
  metricType: 'DAILY_VISITORS',
  minimumValue: 0,
  expectedVersion: saved.data.version,
})
check('일반 회원은 운영자 조건 API 사용 불가', userTry.status === 403, `${userTry.status}`)
const list = (await call(admin, 'GET', '/admin/campaigns')).data
const row = list.find((item) => item.id === campaignId)
check(
  '운영자 목록에 현재 조건 표시',
  row?.requirement?.metricType === 'DAILY_VISITORS',
)

// 2. 참여자: 확인 전에는 신청 불가, 직접 입력은 차단, '지금 확인'은 실제 위젯을 읽습니다.
sql(
  `update member_channel_metric set verification_status='UNVERIFIED' where member_id=(select id from member where email='${process.env.VISITOR_USER || 'junho@movrit.local'}') and metric_type='DAILY_VISITORS'`,
)
let state = await eligibility(campaignId)
check(
  '확인 전에는 신청할 수 없음',
  state.canApply === false &&
    state.blockingReasons.some((r) => r.startsWith('CHANNEL_METRIC_')),
  state.blockingReasons.join(','),
)
const manual = await call(user, 'PUT', '/users/me/channel-profile', {
  channelType: 'NAVER_BLOG',
  metricType: 'DAILY_VISITORS',
  value: 99999,
})
check('방문자 수 직접 입력은 거절', manual.status === 400, `${manual.status}`)
const checked = await call(
  user,
  'POST',
  '/users/me/channel-profile/naver-blog-visitors',
)
check(
  '지금 확인: 최근 4일(오늘 제외) 평균 기록',
  checked.status === 200 && checked.data.days >= 1,
  `${checked.status} 평균 ${checked.data?.averageVisitors}명 · ${checked.data?.days}일 · ${JSON.stringify(checked.data?.dailyVisitors ?? checked.data)}`,
)
const average = checked.data?.averageVisitors ?? 0
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
check(
  '오늘 방문자는 평균에서 제외',
  (checked.data?.dailyVisitors || []).every((day) => day.date < today),
)

// 3. 기준보다 낮으면 미달, 확인한 지 하루가 지나면 다시 확인을 요구합니다.
saved = await call(admin, 'PUT', requirementPath, {
  channelType: 'NAVER_BLOG',
  metricType: 'DAILY_VISITORS',
  minimumValue: average + 1,
  expectedVersion: saved.data.version,
})
state = await eligibility(campaignId)
check(
  '평균이 기준 미달이면 신청 불가',
  state.blockingReasons.includes('CHANNEL_METRIC_BELOW_MINIMUM'),
  `기준 ${average + 1}명 · ${state.blockingReasons.join(',')}`,
)
sql(
  `update member_channel_metric set measured_at = now() - interval '25 hours' where member_id=(select id from member where email='${process.env.VISITOR_USER || 'junho@movrit.local'}') and metric_type='DAILY_VISITORS'`,
)
state = await eligibility(campaignId)
check(
  '확인한 지 하루가 지나면 다시 확인 요구',
  state.blockingReasons.includes('CHANNEL_METRIC_STALE'),
  state.blockingReasons.join(','),
)

// 4. 화면: 참여자 신청 영역의 방문자 확인 안내와 '지금 확인' 버튼
const browser = await openBrowser()
const up = await pageAs(browser, user)
await up.goto(`${base}/campaign/${campaignId}`, { waitUntil: 'networkidle' })
const panel = up.getByRole('region', { name: '블로그 방문자 수 확인' })
check('신청 영역에 방문자 확인 안내 표시', await panel.isVisible())
await panel.getByRole('button', { name: '지금 확인' }).click()
await up
  .getByText(/평균 .*명으로 확인되었습니다/)
  .waitFor({ timeout: 20000 })
  .catch(() => {})
const statusText = await panel.innerText()
check('화면 지금 확인 결과 표시', /명으로 확인되었습니다/.test(statusText))
await panel.scrollIntoViewIfNeeded()
await up.screenshot({ path: './e2e/visitor_user_panel.png', fullPage: true })
state = await eligibility(campaignId)
check(
  '다시 확인 후 하루 지남 사유 해제',
  !state.blockingReasons.includes('CHANNEL_METRIC_STALE'),
  state.blockingReasons.join(','),
)

// 5. 운영자 화면에서 기준을 평균과 같게 낮추면 신청할 수 있습니다.
const ap = await pageAs(browser, admin)
await ap.goto(`${base}/admin/campaigns`, { waitUntil: 'networkidle' })
await ap.getByLabel('캠페인 검색').fill(String(campaignId))
const adminRow = ap.locator('tr', { hasText: '[점검] 블로그 방문자 조건' })
check(
  '운영자 화면 목록에 조건 요약 표시',
  /네이버 블로그 일평균 방문자/.test(await adminRow.innerText()),
)
await adminRow.getByRole('button', { name: '조건 설정' }).click()
await ap.getByRole('spinbutton').fill(String(average))
await ap.screenshot({ path: './e2e/visitor_admin_editor.png', fullPage: true })
await ap.getByRole('button', { name: '조건 저장' }).click()
await ap.getByText('신청 조건을 저장했습니다').waitFor({ timeout: 10000 })
check('운영자 화면에서 기준 저장', true, `기준 ${average}명`)
state = await eligibility(campaignId)
check('기준 충족 시 신청 가능', state.canApply === true, state.blockingReasons.join(','))

// 6. 신청하면 신청 당시 방문자 수가 신청 기록에 남습니다.
const form = (
  await call(user, 'GET', `/campaigns/${campaignId}/application-form`)
).data
const applied = await call(user, 'POST', `/campaigns/${campaignId}/applications`, {
  message: '방문자 조건 점검 신청입니다.',
  expectedFormVersion: form.version,
  expectedEligibilityRequirementId: state.campaignRequirement.id,
  expectedEligibilityRequirementVersion: state.campaignRequirement.version,
  fulfillmentType: 'DELIVERY',
  shippingContact: {
    recipientName: '점검사용자',
    recipientPhone: '010-0000-0000',
    postalCode: '04524',
    address1: '서울특별시 중구 세종대로 110',
    address2: '3층',
  },
  answers: [],
  agreementAcceptances: [],
})
check('조건 있는 캠페인 신청', [200, 201].includes(applied.status), `${applied.status}`)
const mine = (await call(user, 'GET', '/campaigns/applications/mine')).data
const applicationId = mine.find(
  (a) => String(a.campaignId) === String(campaignId),
)?.id
const snapshot = sql(
  `select eligibility_metric_value, eligibility_metric_measured_at is not null from campaign_application where id=${applicationId}`,
)
check(
  '신청 당시 방문자 수 저장',
  new RegExp(`\\b${average}\\s*\\|\\s*t`).test(snapshot),
  snapshot.split('\n')[2]?.trim(),
)

// 7. 신청 뒤 위젯을 꺼도(현재 값이 사라져도) 업체에는 신청 당시 값이 보입니다.
sql(
  `update member_channel_metric set verification_status='UNVERIFIED' where member_id=(select id from member where email='${process.env.VISITOR_USER || 'junho@movrit.local'}') and metric_type='DAILY_VISITORS'`,
)
const detail = await call(
  brand,
  'GET',
  `/campaigns/applications/${applicationId}/seller-detail`,
)
const evaluation = detail.data?.requirementEvaluation
check(
  '업체 상세: 신청 당시 값으로 판정',
  evaluation?.evaluationBasis === 'METRIC_AT_APPLICATION' &&
    evaluation.currentMetricValue === average &&
    evaluation.satisfied === true,
  JSON.stringify(evaluation),
)
check(
  '업체 상세: 일반 지표 목록에는 방문자 수 없음',
  !(detail.data?.metrics || []).some((m) => m.metricType === 'DAILY_VISITORS'),
)
const sellerList = (await call(brand, 'GET', '/campaigns/applications/seller')).data
// 목록의 참여자 지표(creatorMetrics)에는 방문자 수가 없어야 합니다. 조건 사본(eligibilityRequirementSnapshot)은 조건 설명이라 괜찮습니다.
const listed =
  (Array.isArray(sellerList) ? sellerList : sellerList?.content || []).find(
    (a) => a.id === applicationId,
  ) || {}
check(
  '업체 목록 참여자 지표에는 방문자 수 없음',
  Array.isArray(listed.creatorMetrics) &&
    !listed.creatorMetrics.some((m) => m.metricType === 'DAILY_VISITORS'),
)
const bp = await pageAs(browser, brand)
await bp.goto(
  `${base}/seller/participants?campaignId=${campaignId}&applicationId=${applicationId}`,
  { waitUntil: 'networkidle' },
)
await bp.getByText('신청 당시 일평균 방문자').waitFor({ timeout: 10000 }).catch(() => {})
check(
  '업체 화면: 신청 당시 일평균 방문자 표시',
  await bp.getByText('신청 당시 일평균 방문자').isVisible(),
)
await bp.screenshot({ path: './e2e/visitor_brand_detail.png', fullPage: true })

// 8. 운영자가 조건을 해제하면 업체에 알림이 갑니다.
const current = (await call(admin, 'GET', requirementPath)).data
const removed = await call(
  admin,
  'DELETE',
  `${requirementPath}?expectedVersion=${current.version}`,
)
check('운영자 조건 해제', removed.status === 204, `${removed.status}`)
const notices = sql(
  `select count(*) from notification where target_id=${campaignId} and title like '운영자가 캠페인 신청 조건을%'`,
)
check('조건 변경 알림 발송', /\b[3-9]\b|\b\d{2,}\b/.test(notices), notices.split('\n')[2]?.trim())
const audits = sql(
  `select count(*) from audit_log where target_id=${campaignId} and action like 'ADMIN_CAMPAIGN_REQUIREMENT_%'`,
)
check('조건 변경 감사 기록', /\b[3-9]\b|\b\d{2,}\b/.test(audits), audits.split('\n')[2]?.trim())
const errors = [...up.errors, ...ap.errors, ...bp.errors]
check('화면 오류 없음', errors.length === 0, errors.join(' | '))
await browser.close()

const passed = results.filter(Boolean).length
console.log(`\n결과: ${passed}/${results.length} 통과 · 점검 캠페인 #${campaignId}`)
process.exit(passed === results.length ? 0 : 1)
