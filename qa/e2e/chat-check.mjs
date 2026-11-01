// 브랜드·참여자·운영자 채팅을 실제 화면으로 확인합니다.
// 준비: claude-design-user 가 claude-design-brand 캠페인에 신청한 상태(./e2e/qa-app-b.txt)가 필요합니다.
import fs from 'node:fs'
import { base, call, login, openBrowser, pageAs } from './e2e-lib.mjs'

const appB = fs.readFileSync('./e2e/qa-app-b.txt', 'utf8').trim()
const user = await login('claude-design-user@movrit.local')
const brand = await login('claude-design-brand@movrit.local')
const admin = await login('claude-e2e-admin@movrit.local')
const stranger = await login('claude-e2e-user@movrit.local')
const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`)
}
const stamp = new Date().toLocaleTimeString('ko-KR')
const browser = await openBrowser()
const sendIn = async (page, text) => {
  await page.getByLabel('메시지 입력').fill(text)
  await page.getByRole('button', { name: '보내기' }).click()
  await page
    .locator('.chat-messages')
    .getByText(text)
    .waitFor({ timeout: 10000 })
}

// 1) 브랜드: 참여자 상세 → 참여자와 채팅하기 → 메시지 보내기
const bp = await pageAs(browser, brand)
await bp.goto(`${base}/seller/participants`, { waitUntil: 'networkidle' })
await bp
  .getByRole('button', { name: new RegExp(`신청 ${appB} 상세 보기`) })
  .click()
await bp.getByRole('button', { name: '참여자와 채팅하기' }).click()
await bp.waitForURL(/\/seller\/messages\?room=\d+/, { timeout: 10000 })
const roomId = new URL(bp.url()).searchParams.get('room')
check('브랜드가 신청 대화방을 엶', Boolean(roomId), `room ${roomId}`)
const brandText = `[점검 ${stamp}] 안녕하세요, 브랜드입니다. 배송 주소 확인 부탁드립니다.`
await sendIn(bp, brandText)
check('브랜드 메시지 전송', true)

// 2) 참여자: 헤더 배지 → 메시지 → 브랜드 메시지 확인 후 답장
const up = await pageAs(browser, user)
await up.goto(`${base}/home`, { waitUntil: 'networkidle' })
await up.waitForTimeout(1200)
const badge = await up
  .locator('a[href="/messages"] .main-home-header__badge')
  .innerText()
  .catch(() => '')
check(
  '참여자 헤더에 안 읽은 메시지 배지',
  Number(badge.replace('+', '')) >= 1,
  badge,
)
await up.goto(`${base}/messages?room=${roomId}`, { waitUntil: 'networkidle' })
await up
  .locator('.chat-messages')
  .getByText(brandText)
  .waitFor({ timeout: 10000 })
check('참여자가 브랜드 메시지를 봄', true)
const userText = `[점검 ${stamp}] 네, 주소 맞습니다. 감사합니다!`
await sendIn(up, userText)

// 3) 브랜드 화면이 새로고침 없이 답장을 받는지(3초 폴링)
const got = await bp
  .locator('.chat-messages')
  .getByText(userText)
  .waitFor({ timeout: 10000 })
  .then(() => true)
  .catch(() => false)
check('브랜드 화면에 답장이 자동으로 도착', got)
await bp.screenshot({ path: './e2e/chat_brand.png', fullPage: true })

// 4) 운영자: 전체 목록에서 대화방을 열고 참여
const ap = await pageAs(browser, admin)
await ap.goto(`${base}/admin/messages?room=${roomId}`, {
  waitUntil: 'networkidle',
})
await ap
  .locator('.chat-messages')
  .getByText(userText)
  .waitFor({ timeout: 10000 })
check('운영자가 캠페인 대화를 열람', true)
const adminText = `[점검 ${stamp}] 운영자입니다. 진행에 문제 있으면 말씀해 주세요.`
await sendIn(ap, adminText)
const adminSeen = await up
  .locator('.chat-message.is-admin', { hasText: adminText })
  .waitFor({ timeout: 10000 })
  .then(() => true)
  .catch(() => false)
check('참여자 화면에 운영자 메시지(운영자 표시) 도착', adminSeen)
await up.screenshot({ path: './e2e/chat_user.png', fullPage: true })

// 5) 참여자: 운영자 1:1 문의 → 운영자 목록에 표시
await up.goto(`${base}/messages`, { waitUntil: 'networkidle' })
await up.getByRole('button', { name: '운영자에게 문의' }).click()
await up.waitForURL(/room=\d+/, { timeout: 10000 })
const supportText = `[점검 ${stamp}] 채널 확인은 얼마나 걸리나요?`
await sendIn(up, supportText)
await ap.goto(`${base}/admin/messages`, { waitUntil: 'networkidle' })
check(
  '운영자 목록에 회원 문의 표시',
  (await ap.locator('.chat-list').innerText()).includes('채널 확인은 얼마나'),
)
await ap.screenshot({ path: './e2e/chat_admin.png', fullPage: true })

// 6) 권한: 다른 회원은 이 대화방을 열 수 없습니다(404)
const denied = await call(stranger, 'GET', `/chats/${roomId}/messages`)
check(
  '다른 회원은 대화방 접근 불가',
  denied.status === 404,
  String(denied.status),
)
const empty = await call(user, 'POST', `/chats/${roomId}/messages`, {
  body: '   ',
})
check('빈 메시지는 거절', empty.status === 400, String(empty.status))

console.log('페이지 오류:', bp.errors, up.errors, ap.errors)
await browser.close()
console.log(`\n결과: ${results.filter(Boolean).length}/${results.length} 통과`)
