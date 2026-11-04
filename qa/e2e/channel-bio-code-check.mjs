// SNS 소개글 인증 코드를 실제 서버·화면으로 확인합니다(demo-user 사용).
// - 네이버 블로그: 실제 공개 RSS를 읽습니다. 코드가 없는 실제 블로그(blogpeople)는 '코드 없음', 없는 블로그는 '찾을 수 없음'이어야 합니다.
//   소개글에 코드가 있는 경우(바로 확인됨)는 실제 블로그를 고칠 수 없어 백엔드 단위 테스트로 확인합니다.
// - 인스타그램: 로컬에는 Business Discovery 키가 없으므로 운영자 확인으로 넘어가고, 운영자 화면에 코드가 보이며 승인하면 '확인됨'이 됩니다.
// - 끝나면 demo-user의 인스타그램 연결을 해제해 처음 상태로 돌립니다(점검용 가짜 아이디 movrit.qa.biocode).
// 참고: 인스타그램 흐름은 실행마다 코드를 한 번 쓰므로 하루 5번까지 다시 실행할 수 있습니다(코드 발급 제한).
import { base, call, login, openBrowser, pageAs } from './e2e-lib.mjs'

const user = await login('demo-user@movrit.local')
const admin = await login('demo-admin@movrit.local')
const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`)
}
const path = (provider, rest = '') =>
  `/users/me/channel-connections/${provider}/bio-code${rest}`
await call(user, 'DELETE', '/users/me/channel-connections/instagram')

// ───────── API ─────────
const first = await call(user, 'POST', path('naver-blog'))
const again = await call(user, 'POST', path('naver-blog'))
check(
  '코드 발급(MOVRIT-6자리), 쓸 수 있는 코드는 같은 코드로',
  first.status === 200 &&
    /^MOVRIT-[A-HJ-NP-Z2-9]{6}$/.test(first.data.code) &&
    again.data.code === first.data.code &&
    first.data.autoCheck === true,
  `${first.status} 남은 확인 ${first.data.checksLeft}`,
)
check(
  '유튜브는 소개글 코드를 쓰지 않음(400)',
  (await call(user, 'POST', path('youtube'))).status === 400,
)
const badUrl = await call(user, 'POST', path('naver-blog', '/verify'), {
  profileUrl: 'https://example.com/blogpeople',
})
check('네이버 블로그 주소 형식만 받음(400)', badUrl.status === 400)
const miss = await call(user, 'POST', path('naver-blog', '/verify'), {
  profileUrl: 'https://blog.naver.com/blogpeople',
})
const afterMiss = await call(user, 'GET', path('naver-blog'))
check(
  '실제 블로그 소개글에 코드가 없으면 422, 확인 횟수 1 줄어듦',
  miss.status === 422 &&
    String(miss.data?.detail).includes('찾지 못했습니다') &&
    afterMiss.data.checksLeft === first.data.checksLeft - 1,
  `${miss.status} 남은 ${afterMiss.data.checksLeft}`,
)
const none = await call(user, 'POST', path('naver-blog', '/verify'), {
  profileUrl: 'https://blog.naver.com/naverblog',
})
check(
  '없는(빈) 블로그는 찾을 수 없음(400)',
  none.status === 400 && String(none.data?.detail).includes('찾을 수 없습니다'),
)

const ig = await call(user, 'POST', path('instagram'))
check(
  '인스타그램 코드 발급(로컬은 자동 확인 키 없음)',
  ig.status === 200 && ig.data.autoCheck === false,
  `${ig.status} ${ig.data?.detail || ''}`,
)
const igNoCount = await call(user, 'POST', path('instagram', '/verify'), {
  profileUrl: 'https://www.instagram.com/movrit.qa.biocode',
})
check(
  '자동 확인이 안 되면 팔로워 수가 필요(400)',
  igNoCount.status === 400 && String(igNoCount.data?.detail).includes('팔로워'),
)

// ───────── 화면: 설정에서 인스타그램 소개글 코드 인증 → 운영자 확인 대기 ─────────
const browser = await openBrowser()
const up = await pageAs(browser, user)
await up.goto(`${base}/settings`, { waitUntil: 'networkidle' })
const sec = up.locator('#channel-connect')
const row = sec.locator('li', { hasText: '인스타그램' })
await row.getByRole('button', { name: '소개글 코드 인증' }).click()
const panel = row.getByRole('form', { name: '인스타그램 소개글 코드 인증' })
const shownCode = (await panel.getByLabel('인증 코드').innerText()).trim()
check('설정: 발급한 코드가 화면에 보임', shownCode === ig.data.code, shownCode)
await panel
  .getByLabel('채널 주소')
  .fill('https://www.instagram.com/movrit.qa.biocode')
await panel.getByLabel('팔로워 수').fill('2400')
await up.screenshot({ path: './e2e/bio_code_panel.png', fullPage: true })
await panel.getByRole('button', { name: '소개글 확인하기' }).click()
await up.waitForTimeout(1500)
check(
  '설정: 운영자 확인 대기 안내와 배지',
  (await sec.innerText()).includes('운영자가 소개글의 코드를 확인') &&
    (await row.innerText()).includes('소개글 코드 · 확인 대기'),
)

// ───────── 운영자: 코드 보고 승인 ─────────
const ap = await pageAs(browser, admin)
await ap.goto(`${base}/admin/channel-verifications`, {
  waitUntil: 'networkidle',
})
const adminRow = ap.locator('tr', { hasText: '@movrit.qa.biocode' })
check(
  '운영자 목록: 소개글 코드 · 확인 대기',
  (await adminRow.innerText()).includes('소개글 코드') &&
    (await adminRow.innerText()).includes('확인 대기'),
)
await adminRow.getByRole('button', { name: '확인하기' }).click()
await ap.waitForTimeout(500)
check(
  '운영자 상세: 캡처 대신 인증 코드 표시',
  (await ap.locator('.admin-bio-code').innerText()).includes(ig.data.code),
)
await ap.screenshot({ path: './e2e/bio_code_admin.png', fullPage: true })
const item = (
  await call(admin, 'GET', '/admin/channel-verifications')
).data.find((value) => value.accountName === '@movrit.qa.biocode')
const approved = await call(
  admin,
  'PATCH',
  `/admin/channel-verifications/${item.id}/approve`,
)
const mine = (
  await call(user, 'GET', '/users/me/channel-connections')
).data.find((value) => value.provider === 'instagram')
check(
  '운영자 승인 → 소개글 코드 · 확인됨, 팔로워 2400',
  approved.status === 200 &&
    mine.connection.method === 'BIO_CODE' &&
    mine.connection.verificationStatus === 'VERIFIED' &&
    mine.connection.followerCount === 2400,
)
check(
  '사용한 코드는 다시 쓸 수 없음(새 코드 필요)',
  (await call(user, 'GET', path('instagram'))).status === 204,
)

// ───────── 정리 ─────────
await call(user, 'DELETE', '/users/me/channel-connections/instagram')
console.log('페이지 오류:', [...up.errors, ...ap.errors])
await browser.close()
console.log(`\n결과: ${results.filter(Boolean).length}/${results.length} 통과`)
