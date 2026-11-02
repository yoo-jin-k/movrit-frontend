// 커뮤니티 운영자 관리, 운영 리포트 기간·엑셀, 콘텐츠 성과, 캠페인 서버 검색·페이지를 실제 화면으로 확인합니다.
//
// - 커뮤니티: 점검용 글·댓글을 만들어 가리기·다시 보이기를 확인하고, 끝나면 글을 지웁니다.
// - 콘텐츠 성과: 시연 데이터(seed-portfolio.mjs)의 하늘 계정 콘텐츠에 오늘 숫자를 고쳐 넣었다가 원래 값으로 되돌립니다.
// - 리포트·검색은 읽기만 합니다(엑셀 내려받기 기록은 운영 기록에 남습니다).
import fs from 'node:fs'
import { base, call, login, openBrowser, pageAs } from './e2e-lib.mjs'

const admin = await login('demo-admin@movrit.local')
const user = await login('demo-user@movrit.local')
const haneul = await login('haneul@movrit.local')
const studio = await login('lumi.studio@movrit.local')
const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`)
}
const visible = (locator, timeout = 10000) =>
  locator
    .waitFor({ timeout })
    .then(() => true)
    .catch(() => false)

const browser = await openBrowser()
fs.mkdirSync('./e2e', { recursive: true })

// ───────── 1) 커뮤니티 운영자 관리 ─────────
const stamp = Date.now().toString().slice(-6)
const post = (
  await call(user, 'POST', '/community/posts', {
    board: 'free',
    category: '일상',
    title: `[QA-COMMUNITY ${stamp}] 운영자 관리 점검 글`,
    body: '운영자 가리기·다시 보이기 점검용 글입니다.',
  })
).data
const comment = (
  await call(user, 'POST', `/community/posts/${post.id}/comments`, {
    body: `점검용 댓글 ${stamp}`,
  })
).data

const ap = await pageAs(browser, admin)
await ap.goto(`${base}/admin/community`, { waitUntil: 'networkidle' })
await ap.getByLabel('검색어').fill(`QA-COMMUNITY ${stamp}`)
await ap.getByRole('button', { name: '검색' }).click()
check(
  '운영자 글 검색',
  await visible(ap.getByText(`[QA-COMMUNITY ${stamp}] 운영자 관리 점검 글`)),
)
await ap.getByRole('button', { name: `글 ${post.id} 보기` }).click()
await ap.getByLabel(/처리 메모/).fill('점검용으로 가립니다.')
await ap.getByRole('button', { name: `댓글 ${comment.id} 가리기` }).click()
check(
  '댓글 가리기',
  await visible(
    ap.getByText('댓글을 가렸습니다. 작성자에게 알림을 보냈습니다.'),
  ),
)
const hiddenDetail = (await call(user, 'GET', `/community/posts/${post.id}`))
  .data
const hiddenComment = hiddenDetail.comments.find((c) => c.id === comment.id)
check(
  '회원 화면: 가린 댓글은 안내 문구',
  hiddenComment?.hidden === true &&
    hiddenComment.body.includes('운영자가 가린 댓글'),
)
const up = await pageAs(browser, user)
await up.goto(`${base}/community/free/${post.id}`, { waitUntil: 'networkidle' })
check(
  '회원 화면 표시',
  await visible(up.getByText('운영 정책에 따라 운영자가 가린 댓글입니다.')),
)
await ap.getByRole('button', { name: `댓글 ${comment.id} 다시 보이기` }).click()
await ap.waitForTimeout(800)
const shownAgain = (
  await call(user, 'GET', `/community/posts/${post.id}`)
).data.comments.find((c) => c.id === comment.id)
check('댓글 다시 보이기', shownAgain?.body === `점검용 댓글 ${stamp}`)

await ap.getByRole('button', { name: '글 가리기' }).click()
await ap.waitForTimeout(800)
check(
  '글 가리기: 회원 상세 404',
  (await call(user, 'GET', `/community/posts/${post.id}`)).status === 404,
)
await ap.getByLabel('공개 상태').selectOption('HIDDEN')
check(
  '가린 글 필터',
  await visible(ap.getByRole('button', { name: `글 ${post.id} 보기` })),
)
await ap.getByRole('button', { name: '글 다시 보이기' }).click()
await ap.waitForTimeout(800)
check(
  '글 다시 보이기',
  (await call(user, 'GET', `/community/posts/${post.id}`)).status === 200,
)
const repeat = await call(
  admin,
  'PATCH',
  `/admin/community/posts/${post.id}/visibility`,
  { hidden: false },
)
check('이미 보이는 글은 409', repeat.status === 409)
check(
  '일반 회원은 운영자 API 403',
  (await call(user, 'GET', '/admin/community/posts')).status === 403,
)
const notes = (await call(user, 'GET', '/notifications')).data
const noteList = Array.isArray(notes) ? notes : notes?.content || []
check(
  '작성자 알림',
  JSON.stringify(noteList.slice(0, 6)).includes('커뮤니티 댓글이 가려졌습니다'),
)
await call(user, 'DELETE', `/community/posts/${post.id}`)

// ───────── 2) 운영 리포트 기간·엑셀 ─────────
await ap.goto(`${base}/admin/reports`, { waitUntil: 'networkidle' })
check(
  '기본 기간 최근 30일 + 날짜별 추이',
  (await ap
    .getByRole('button', { name: '최근 30일' })
    .getAttribute('aria-pressed')) === 'true' &&
    (await visible(ap.getByText('날짜별 추이'))),
)
await ap.getByRole('button', { name: '전체 기간' }).click()
await ap.waitForTimeout(1000)
check(
  '전체 기간은 날짜별 추이 없음',
  (await ap.getByText('날짜별 추이').count()) === 0 &&
    (await visible(ap.getByText(/^전체 기간 ·/))),
)
await ap.getByRole('button', { name: '직접 고르기' }).click()
await ap.getByLabel('시작일').fill('2026-11-03')
await ap.getByLabel('종료일').fill('2026-11-01')
check(
  '잘못된 기간 안내·적용 막힘',
  (await visible(ap.getByText('시작일이 종료일보다 늦습니다.'))) &&
    (await ap.getByRole('button', { name: '적용' }).isDisabled()),
)
await ap.getByLabel('시작일').fill('2026-10-28')
await ap.getByLabel('종료일').fill('2026-11-03')
await ap.getByRole('button', { name: '적용' }).click()
check(
  '직접 고른 기간 적용',
  await visible(ap.getByText(/2026-10-28 ~ 2026-11-03/)),
)
const [download] = await Promise.all([
  ap.waitForEvent('download'),
  ap.getByRole('button', { name: '엑셀 내려받기' }).click(),
])
const file = `./e2e/${download.suggestedFilename()}`
await download.saveAs(file)
const bytes = fs.readFileSync(file)
check(
  '리포트 엑셀(xlsx)',
  download.suggestedFilename().includes('2026-10-28_2026-11-03') &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b,
  download.suggestedFilename(),
)
check(
  '1년 넘는 기간은 400',
  (await call(admin, 'GET', '/admin/reports?from=2025-01-01&to=2026-11-03'))
    .status === 400,
)

// ───────── 3) 콘텐츠 성과 ─────────
const mine = (await call(haneul, 'GET', '/campaign-contents/mine')).data
const content = mine.find((c) => c.campaignTitle.startsWith('시카 수분 앰플'))
const before = (
  await call(haneul, 'GET', `/campaign-contents/${content.id}/metrics`)
).data.links[0].latest
const hp = await pageAs(browser, haneul)
await hp.goto(`${base}/mypage/campaigns`, { waitUntil: 'networkidle' })
await hp
  .getByRole('navigation', { name: '내 캠페인 선택' })
  .getByRole('button', { name: /시카 수분 앰플/ })
  .first()
  .click()
check(
  '참여자 성과 영역',
  await visible(hp.getByRole('region', { name: '콘텐츠 성과' })),
)
check(
  '최근 기록·증감 표시',
  (await visible(
    hp.getByText(before.viewCount.toLocaleString('ko-KR')).first(),
  )) && (await hp.getByText(/일 전 기록과 비교/).count()) > 0,
)
await hp.getByRole('button', { name: '오늘 성과 기록' }).click()
await hp.getByLabel('조회수').fill('abc')
await hp.getByRole('button', { name: '저장' }).click()
check(
  '잘못된 숫자 안내',
  await visible(hp.getByText('조회수 칸에 0 이상의 숫자를 입력해 주세요.')),
)
await hp.getByLabel('조회수').fill('2,700')
await hp.getByRole('button', { name: '저장' }).click()
check('성과 저장', await visible(hp.getByText(/성과를 저장했습니다/)))
check('저장 값 반영', await visible(hp.getByText('2,700').first()))
// 시연 데이터 원래 값으로 되돌립니다.
await call(haneul, 'PUT', `/campaign-contents/${content.id}/metrics`, {
  contentUrl: content.links[0].contentUrl,
  viewCount: before.viewCount,
  likeCount: before.likeCount,
  commentCount: before.commentCount,
  measuredOn: before.measuredOn,
})
check(
  '다른 참여자는 볼 수 없음(404)',
  (await call(user, 'GET', `/campaign-contents/${content.id}/metrics`))
    .status === 404,
)
const sp = await pageAs(browser, studio)
await sp.goto(`${base}/seller/contents`, { waitUntil: 'networkidle' })
await sp
  .getByLabel('성과를 볼 캠페인')
  .selectOption({ label: '시카 수분 앰플 2주 사용 후기 체험단' })
check(
  '업체 캠페인 성과 요약',
  (await visible(sp.getByText('조회수 합계'))) &&
    (await visible(sp.getByText('2 / 2'))),
)

// ───────── 4) 캠페인 서버 검색·페이지 ─────────
const pp = await pageAs(browser, null)
await pp.goto(`${base}/search?q=${encodeURIComponent('앰플')}`, {
  waitUntil: 'networkidle',
})
check(
  '검색: 서버 결과 수',
  await visible(pp.getByText(/^캠페인 \d+개$/)),
  await pp
    .getByText(/^캠페인 \d+개$/)
    .textContent()
    .catch(() => ''),
)
check(
  '검색: 결과 카드',
  await visible(pp.getByText('시카 수분 앰플 2주 사용 후기 체험단').first()),
)
const searchRequest = pp.waitForRequest(
  (req) =>
    req.url().includes('/collaborations/campaigns/search') &&
    req.url().includes('sort=popular'),
)
await pp.goto(`${base}/category/지역?sort=popular`)
check(
  '목록: 정렬이 서버 요청에 실림',
  await searchRequest.then(() => true).catch(() => false),
)
await pp.goto(`${base}/category/제품?page=99`, { waitUntil: 'networkidle' })
check(
  '없는 페이지 안내',
  await visible(pp.getByText('페이지를 찾을 수 없습니다.')),
)
const errors = [ap, up, hp, sp, pp].flatMap((page) => page.errors)
check('화면 오류 없음', errors.length === 0, errors.join(' | '))

await browser.close()
const passed = results.filter(Boolean).length
console.log(`\n결과: ${passed}/${results.length}`)
process.exit(passed === results.length ? 0 : 1)
