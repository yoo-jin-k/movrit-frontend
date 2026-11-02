// 커뮤니티 글·댓글, 채팅 첨부·읽음·이전 메시지·실시간 이벤트·알림, 회원 탈퇴를 실제 화면으로 확인합니다.
// 준비: demo-creator 가 demo-brand 캠페인에 신청한 상태(./e2e/qa-app-b.txt)가 필요합니다.
// 탈퇴 점검은 매번 새로 가입한 임시 계정(qa-withdraw-…@movrit.local)으로만 합니다.
import fs from 'node:fs'
import { api, base, call, login, openBrowser, pageAs } from './e2e-lib.mjs'

const appB = fs.readFileSync('./e2e/qa-app-b.txt', 'utf8').trim()
const user = await login('demo-creator@movrit.local')
const brand = await login('demo-brand@movrit.local')
const other = await login('demo-user@movrit.local')
const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`)
}
const stamp = Date.now() % 100000
const browser = await openBrowser()

// ───────── 1) 커뮤니티 ─────────
const up = await pageAs(browser, user)
await up.goto(`${base}/community/free`, { waitUntil: 'networkidle' })
await up.getByRole('link', { name: '글 등록' }).click()
await up.getByLabel('제목').fill(`[점검 ${stamp}] 첫 체험단 후기 공유합니다`)
await up
  .getByLabel('내용')
  .fill('수분 세럼 체험단에 참여했는데 배송이 빨랐어요.\n사진 팁도 나눠요!')
await up.getByRole('button', { name: '글 등록' }).click()
await up.waitForURL(/\/community\/free\/\d+$/, { timeout: 10000 })
const postId = up.url().split('/').pop()
await up
  .locator('h1', { hasText: '첫 체험단 후기' })
  .waitFor({ timeout: 10000 })
check(
  '회원이 글을 등록',
  (await up.locator('main').innerText()).includes('첫 체험단 후기'),
  `#${postId}`,
)

const op = await pageAs(browser, other)
await op.goto(`${base}/community/free/${postId}`, { waitUntil: 'networkidle' })
check(
  '다른 회원에게는 고치기·지우기 버튼 없음',
  (await op.getByRole('link', { name: '고치기' }).count()) === 0,
)
await op.getByLabel('댓글 입력').fill('좋은 정보 감사합니다!')
await op.getByRole('button', { name: '댓글 등록' }).click()
await op.getByText('좋은 정보 감사합니다!').waitFor({ timeout: 10000 })
check('다른 회원이 댓글 등록', true)

await up.reload({ waitUntil: 'networkidle' })
await up.getByRole('link', { name: '고치기' }).click()
// 기존 글 내용이 입력란에 채워진 뒤 고칩니다.
await up.waitForFunction(() =>
  document
    .querySelector('.discovery-write input')
    ?.value?.includes('첫 체험단'),
)
await up
  .getByLabel('제목')
  .fill(`[점검 ${stamp}] 첫 체험단 후기 공유합니다(수정)`)
await up.getByRole('button', { name: '수정 완료' }).click()
await up.waitForURL(new RegExp(`/community/free/${postId}$`))
check(
  '글쓴이가 글을 고침',
  await up
    .locator('h1', { hasText: '(수정)' })
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false),
)
const guest = await pageAs(browser, null)
await guest.goto(`${base}/community/free`, { waitUntil: 'networkidle' })
const listText = await guest.locator('.discovery-post-list').innerText()
check(
  '로그인 없이 목록에서 글·댓글 수 확인',
  listText.includes('(수정)') && listText.includes('[1]'),
)
await guest.goto(`${base}/community/event`, { waitUntil: 'networkidle' })
check(
  '이벤트 게시판에는 회원 글 등록 버튼 없음',
  (await guest.getByRole('link', { name: '글 등록' }).count()) === 0,
)
const forbidden = await call(user, 'POST', '/community/posts', {
  board: 'event',
  category: '일상',
  title: '권한 점검',
  body: '운영자 전용 게시판 쓰기 시도',
})
check(
  '운영자 전용 게시판 쓰기는 거절',
  forbidden.status === 403,
  String(forbidden.status),
)
// 점검 글은 글쓴이가 지워 목록에 남기지 않습니다.
await up.getByRole('button', { name: '지우기' }).first().click()
await up.waitForURL(/\/community\/free$/, { timeout: 10000 })
// 목록을 서버에서 다시 받을 때까지 잠시 기다립니다.
await up.waitForTimeout(1500)
check(
  '글쓴이가 글을 지움',
  !(await up.locator('main').innerText()).includes(`[점검 ${stamp}]`),
)

// ───────── 2) 채팅: 실시간·첨부·읽음·이전 메시지·알림 ─────────
const room = (await call(brand, 'POST', `/chats/applications/${appB}`)).data
// 실시간 확인용 화면은 채팅 연결을 열어 둡니다(네트워크가 계속 열려 있으므로 networkidle을 기다리지 않습니다).
const rt = await pageAs(browser, user, 1280, { stream: true })
await rt.goto(`${base}/messages?room=${room.id}`, {
  waitUntil: 'domcontentloaded',
})
await rt.locator('.chat-messages').waitFor({ timeout: 10000 })
await rt.waitForTimeout(2000)
const live = `[실시간 ${stamp}] 지금 보내는 메시지입니다`
const sentAt = Date.now()
await call(brand, 'POST', `/chats/${room.id}/messages`, { body: live })
const arrived = await rt
  .locator('.chat-messages')
  .getByText(live)
  .waitFor({ timeout: 2800 })
  .then(() => true)
  .catch(() => false)
check('실시간 이벤트로 3초 안에 도착', arrived, `${Date.now() - sentAt}ms`)

// 브랜드 화면: 참여자가 읽으면 '읽음' 표시
await up.goto(`${base}/messages?room=${room.id}`, { waitUntil: 'networkidle' })
const bp = await pageAs(browser, brand)
await bp.goto(`${base}/seller/messages?room=${room.id}`, {
  waitUntil: 'networkidle',
})
const mine = bp.locator('.chat-message.is-mine', { hasText: live })
const readShown = await mine
  .locator('.chat-read')
  .waitFor({ timeout: 5000 })
  .then(() => true)
  .catch(() => false)
check('내 메시지에 읽음 표시', readShown)

// 첨부: 사진·PDF
const png = './e2e/qa-evidence.png'
const pdf = './e2e/qa-sample.pdf'
fs.writeFileSync(pdf, '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')
await bp.locator('.chat-attach input[type=file]').setInputFiles(png)
await bp.getByLabel('메시지 입력').fill('제품 사진 참고해 주세요')
await bp.getByRole('button', { name: '보내기' }).click()
await bp
  .locator('.chat-message.is-mine img.chat-attachment__image')
  .last()
  .waitFor({ timeout: 10000 })
await bp.locator('.chat-attach input[type=file]').setInputFiles(pdf)
await bp.getByRole('button', { name: '보내기' }).click()
await bp
  .getByRole('button', { name: /qa-sample\.pdf/ })
  .last()
  .waitFor({ timeout: 10000 })
check('브랜드가 사진·PDF 첨부 전송', true)
const userImg = up
  .locator('.chat-message:not(.is-mine) img.chat-attachment__image')
  .last()
const imgOk = await userImg
  .waitFor({ timeout: 6000 })
  .then(async () => (await userImg.evaluate((el) => el.naturalWidth)) > 0)
  .catch(() => false)
check('참여자 화면에 사진이 보임', imgOk)
check(
  '참여자 화면에 PDF 받기 버튼',
  (await up.getByRole('button', { name: /qa-sample\.pdf/ }).count()) > 0,
)
const stranger = await call(other, 'GET', `/chats/${room.id}/attachments/1`)
check(
  '다른 회원은 첨부를 받을 수 없음',
  stranger.status === 404,
  String(stranger.status),
)
await bp.screenshot({ path: './e2e/chat_attachments.png', fullPage: true })

// 이전 메시지 더 보기: 60개를 더 보내고 처음 열면 50개만 보이고 버튼으로 더 불러옵니다.
for (let i = 1; i <= 60; i += 1)
  await call(brand, 'POST', `/chats/${room.id}/messages`, {
    body: `[대량 ${stamp}] ${i}번째`,
  })
await up.goto(`${base}/messages?room=${room.id}`, { waitUntil: 'networkidle' })
const before = await up.locator('.chat-message').count()
await up.getByRole('button', { name: '이전 메시지 더 보기' }).click()
await up.waitForTimeout(1500)
const after = await up.locator('.chat-message').count()
check(
  '이전 메시지 더 보기',
  before === 50 && after > before,
  `${before} → ${after}`,
)

// 알림함: 참여자가 안 읽은 상태에서 온 첫 메시지는 알림으로도 들어옵니다(대화방을 열어 둔 화면은 닫습니다).
await rt.close()
await up.goto(`${base}/home`, { waitUntil: 'networkidle' })
await call(brand, 'POST', `/chats/${room.id}/messages`, {
  body: `[알림 ${stamp}] 확인 부탁드립니다`,
})
await up.waitForTimeout(1500)
const notes = (await call(user, 'GET', '/notifications')).data
check(
  '알림함에 새 메시지 알림',
  notes[0]?.targetType === 'CHAT_ROOM',
  notes[0]?.title,
)
await call(brand, 'POST', `/chats/${room.id}/messages`, {
  body: `[알림 ${stamp}] 두 번째`,
})
const notes2 = (await call(user, 'GET', '/notifications')).data
check('연달아 온 메시지는 알림이 쌓이지 않음', notes2[0]?.id === notes[0]?.id)

// ───────── 3) 회원 탈퇴 ─────────
await up.goto(`${base}/settings/withdraw`, { waitUntil: 'networkidle' })
await up.waitForTimeout(800)
check(
  '진행 중인 캠페인이 있으면 탈퇴 불가 안내',
  (await up.locator('main').innerText()).includes('지금은 탈퇴할 수 없습니다'),
)
const email = `qa-withdraw-${stamp}@movrit.local`
const signup = await fetch(`${api}/members/signup`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email,
    password: 'Withdraw123',
    name: '탈퇴점검',
    nickname: `탈퇴점검${stamp}`,
    phone: '',
  }),
})
const tokenRes = await fetch(`${api}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password: 'Withdraw123' }),
})
const temp = await tokenRes.json()
check(
  '임시 계정 가입·로그인',
  signup.ok && tokenRes.ok,
  `${signup.status}/${tokenRes.status}`,
)
const wp = await pageAs(browser, temp)
await wp.goto(`${base}/settings/withdraw`, { waitUntil: 'networkidle' })
await wp.getByLabel(/확인 문구/).fill('탈퇴합니다')
await wp.getByRole('button', { name: '계정 탈퇴' }).click()
await wp.waitForURL(/\/home$/, { timeout: 10000 })
const relogin = await fetch(`${api}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password: 'Withdraw123' }),
})
check('탈퇴 후 같은 계정으로 로그인 불가', !relogin.ok, String(relogin.status))

console.log(
  '페이지 오류:',
  up.errors,
  op.errors,
  guest.errors,
  bp.errors,
  wp.errors,
)
await browser.close()
console.log(`\n결과: ${results.filter(Boolean).length}/${results.length} 통과`)
