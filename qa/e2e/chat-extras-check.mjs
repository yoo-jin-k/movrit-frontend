// 채팅 추가 기능을 실제 화면으로 확인합니다: 입력 중 표시, 사진 여러 장·영상 한 번에 보내기, 영상 재생, 메시지 검색·이동.
// 준비: purchase-review-check.mjs 를 먼저 실행해 e2e/purchase-application-id.txt(브랜드·참여자 신청)가 있어야 합니다.
import fs from 'node:fs'
import { base, call, login, openBrowser, pageAs } from './e2e-lib.mjs'

const appId = fs
  .readFileSync('./e2e/purchase-application-id.txt', 'utf8')
  .trim()
const brand = await login('claude-design-brand@movrit.local')
const user = await login('claude-e2e-user@movrit.local')
const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`)
}
const asset = (name) =>
  new URL(`../../public/assets/discovery/banners/${name}`, import.meta.url)
    .pathname
const clip = new URL('./e2e/qa-clip.mp4', import.meta.url).pathname
const stamp = Date.now().toString(36)
const keyword = `검색점검${stamp}`
const room = (await call(brand, 'POST', `/chats/applications/${appId}`)).data
const browser = await openBrowser()

// 두 화면 모두 실시간 연결을 엽니다(networkidle은 기다리지 않습니다).
const up = await pageAs(browser, user, 1280, { stream: true })
await up.goto(`${base}/messages?room=${room.id}`, {
  waitUntil: 'domcontentloaded',
})
await up.locator('.chat-messages').waitFor({ timeout: 10000 })
const bp = await pageAs(browser, brand, 1280, { stream: true })
await bp.goto(`${base}/seller/messages?room=${room.id}`, {
  waitUntil: 'domcontentloaded',
})
await bp.locator('.chat-messages').waitFor({ timeout: 10000 })
await up.waitForTimeout(2000)

// 1) 입력 중: 브랜드가 글을 쓰기 시작하면 참여자 화면에 '○○님이 입력 중'이 뜨고, 5초 뒤 사라집니다.
await bp.getByLabel('메시지 입력').pressSequentially('안녕하세요', {
  delay: 40,
})
const typingShown = await up
  .locator('.chat-typing')
  .getByText(/입력 중/)
  .waitFor({ timeout: 4000 })
  .then(() => true)
  .catch(() => false)
check(
  '상대 화면에 입력 중 표시',
  typingShown,
  typingShown ? await up.locator('.chat-typing').innerText() : '',
)
await up.screenshot({ path: './e2e/chat_typing.png' })
await up.waitForTimeout(6500)
check(
  '입력을 멈추면 5초 뒤 사라짐',
  (await up.locator('.chat-typing').innerText()).trim() === '',
)

// 2) 검색어가 들어간 메시지를 보냅니다.
await bp.getByLabel('메시지 입력').fill(`이번 ${keyword} 메시지를 찾아 주세요`)
await bp.getByRole('button', { name: '보내기', exact: true }).click()
await up.locator('.chat-messages').getByText(keyword).waitFor({ timeout: 5000 })

// 3) 사진 2장 + 영상 1개를 한 번에 보내기(파일마다 메시지 하나)
await bp
  .locator('.chat-attach input[type=file]')
  .setInputFiles([asset('review.png'), asset('dining.png'), clip])
check(
  '파일 3개 선택 표시',
  (await bp.locator('.chat-input__files li').count()) === 3 &&
    (await bp.getByRole('button', { name: '3개 보내기' }).count()) === 1,
)
await bp.getByLabel('메시지 입력').fill('사진과 영상 보내 드립니다')
await bp.getByRole('button', { name: '3개 보내기' }).click()
await bp
  .locator('.chat-input__files')
  .waitFor({ state: 'detached', timeout: 20000 })
const latest = (await call(user, 'GET', `/chats/${room.id}/messages`)).data
const lastThree = latest.messages.slice(-3)
check(
  '메시지 3개로 저장(글은 첫 파일에만)',
  lastThree.every((m) => m.attachment) &&
    lastThree[0].body === '사진과 영상 보내 드립니다' &&
    lastThree[2].attachment.contentType === 'video/mp4',
  lastThree.map((m) => m.attachment?.contentType).join(', '),
)

// 4) 참여자 화면: 사진 2장은 바로 보이고, 영상은 '재생'을 누르면 화면 안에서 재생됩니다.
const videoButton = up.locator('.chat-attachment__play').last()
await videoButton.waitFor({ timeout: 8000 })
await up.waitForTimeout(1500)
check(
  '사진 2장 표시',
  (await up.locator('.chat-attachment__image').count()) >= 2,
)
await videoButton.click()
const video = up.locator('video.chat-attachment__video').last()
const playable = await video
  .waitFor({ timeout: 10000 })
  .then(() =>
    video.evaluate(
      (el) =>
        new Promise((resolve) => {
          if (el.readyState >= 1) return resolve(el.duration)
          el.addEventListener('loadedmetadata', () => resolve(el.duration))
          el.addEventListener('error', () => resolve(-1))
          setTimeout(() => resolve(-2), 5000)
        }),
    ),
  )
  .catch(() => -3)
check('영상 재생(길이 읽힘)', playable > 0, `duration=${playable}`)
await up.screenshot({ path: './e2e/chat_media.png', fullPage: true })

// 5) 서버 거절: 지원하지 않는 형식, 빈 검색어
const gif = new FormData()
gif.append('file', new Blob(['GIF89a....'], { type: 'image/gif' }), 'a.gif')
const rejected = await fetch(
  `http://localhost:18080/api/chats/${room.id}/attachments`,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${brand.accessToken}` },
    body: gif,
  },
)
check(
  '지원하지 않는 형식 400',
  rejected.status === 400,
  `${rejected.status} ${await rejected.text()}`.slice(0, 160),
)
check(
  '빈 검색어 400',
  (await call(user, 'GET', `/chats/${room.id}/search?q=%20`)).status === 400,
)

// 6) 검색: 검색어로 찾고, 결과를 누르면 그 메시지로 이동해 강조합니다.
for (let i = 0; i < 3; i += 1)
  await call(brand, 'POST', `/chats/${room.id}/messages`, {
    body: `검색 뒤에 쌓인 메시지 ${i + 1}`,
  })
await up.waitForTimeout(1500)
await up.getByRole('button', { name: '대화 검색', exact: true }).click()
await up.getByLabel('대화 검색어').fill(keyword)
await up.getByRole('button', { name: '찾기' }).click()
const result = up.getByRole('list', { name: '검색 결과' }).getByRole('button')
await result.first().waitFor({ timeout: 5000 })
check(
  '검색 결과 1건·검색어 강조',
  (await result.count()) === 1 &&
    (await up.locator('.chat-search__results mark').innerText()) === keyword,
)
await result.first().click()
const focused = up.locator('.chat-message.is-focused')
check(
  '결과를 누르면 그 메시지로 이동·강조',
  await focused
    .getByText(keyword)
    .waitFor({ timeout: 5000 })
    .then(() => true)
    .catch(() => false),
)
await up.screenshot({ path: './e2e/chat_search.png' })
const scope = await call(
  user,
  'GET',
  `/chats/${room.id}/search?q=${encodeURIComponent('dining')}`,
)
check(
  '첨부 파일 이름으로도 검색',
  scope.status === 200 &&
    scope.data.some((m) => m.attachment?.name === 'dining.png'),
)

console.log('페이지 오류:', [...up.errors, ...bp.errors])
await browser.close()
console.log(`\n결과: ${results.filter(Boolean).length}/${results.length} 통과`)
