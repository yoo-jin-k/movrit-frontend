// 포트폴리오 시연 영상(참여자 → 업체 → 운영자 흐름)을 녹화합니다.
// 준비: 통합 서버·프론트 실행, seed-portfolio.mjs 로 시연 데이터 준비
// 실행: MOVRIT_QA_PASSWORD=... node qa/portfolio/record-demo.mjs
// 결과: 저장소 바깥 movrit-portfolio-media/frames/<장면>/ 에 프레임(jpg)과 frames.txt(ffmpeg concat 목록)
//
// Playwright 녹화(recordVideo)는 별도 ffmpeg 내려받기가 필요해서, 크롬 화면 전송(CDP screencast)
// 프레임을 받아 두고 영상 변환은 ffmpeg로 따로 합니다. 예)
//   ffmpeg -f concat -safe 0 -i frames/01-participant-apply/frames.txt -vf "fps=30,format=yuv420p" 01.mp4
//
// 시연 데이터를 바꾸지 않도록 신청·저장 버튼은 누르지 않고 화면 이동과 입력까지만 보여 줍니다.
import fs from 'node:fs'
import { chromium } from 'playwright-core'
import { base, call, login } from '../e2e/e2e-lib.mjs'

const out =
  process.env.MOVRIT_DEMO_OUT ||
  new URL('../../../movrit-portfolio-media/frames/', import.meta.url).pathname
fs.rmSync(out, { recursive: true, force: true })
fs.mkdirSync(out, { recursive: true })

const size = { width: 1440, height: 900 }
// 화면 전송은 창 크기를 기준으로 잘리므로 창을 뷰포트와 같은 크기로 띄웁니다.
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: [`--window-size=${size.width},${size.height}`],
})
const auth = {
  studio: await login('lumi.studio@movrit.local'),
  haneul: await login('haneul@movrit.local'),
  minji: await login('minji@movrit.local'),
  admin: await login('demo-admin@movrit.local'),
}
const ids = Object.fromEntries(
  (await call(auth.studio, 'GET', '/collaborations/campaigns/seller')).data.map(
    (c) => [c.title, c.id],
  ),
)
const ampoule = ids['시카 수분 앰플 2주 사용 후기 체험단']
const coffee = ids['콜드브루 원두 구매평 캠페인']
const haneulApp = (
  await call(auth.haneul, 'GET', '/campaigns/applications/mine')
).data.find((a) => a.campaignId === ampoule)
const room = (
  await call(auth.studio, 'POST', `/chats/applications/${haneulApp.id}`)
).data

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 장면 하나를 프레임 묶음으로 남깁니다. 로그인 토큰은 저장소에 미리 넣어 둡니다.
 * 화면이 바뀔 때만 프레임이 오므로, 프레임마다 다음 프레임까지의 시간을 함께 적어 둡니다.
 */
async function scene(name, who, run) {
  const dir = `${out}${name}/`
  fs.mkdirSync(dir, { recursive: true })
  const ctx = await browser.newContext({ viewport: size })
  const token = who ? auth[who] : null
  if (token)
    await ctx.addInitScript(
      ([a, r]) => {
        sessionStorage.setItem('accessToken', a)
        localStorage.setItem('refreshToken', r)
      },
      [token.accessToken, token.refreshToken],
    )
  // 실시간 연결(SSE)이 열려 있으면 networkidle을 기다릴 수 없어 막아 둡니다(목록·메시지는 일반 조회로 보입니다).
  await ctx.route('**/api/chats/stream', (route) => route.abort())
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  const frames = []
  let recording = true
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
    // 장면이 끝난 뒤(창 닫힘 직전)에 오는 빈 화면은 버립니다.
    if (!recording) return
    const file = `${String(frames.length).padStart(5, '0')}.jpg`
    fs.writeFileSync(`${dir}${file}`, Buffer.from(data, 'base64'))
    frames.push({ file, at: metadata.timestamp })
  })
  await cdp.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 88,
    maxWidth: size.width,
    maxHeight: size.height,
  })
  await run(page)
  recording = false
  const endedAt = Date.now() / 1000
  await cdp.send('Page.stopScreencast')
  await ctx.close()
  const lines = ['ffconcat version 1.0']
  frames.forEach((frame, index) => {
    const next = frames[index + 1]?.at ?? endedAt
    lines.push(
      `file '${frame.file}'`,
      `duration ${Math.max(next - frame.at, 0.01).toFixed(3)}`,
    )
  })
  // 마지막 프레임 길이가 반영되도록 한 번 더 적습니다(ffmpeg concat 규칙).
  if (frames.length) lines.push(`file '${frames.at(-1).file}'`)
  fs.writeFileSync(`${dir}frames.txt`, `${lines.join('\n')}\n`)
  console.log('✓', name, `${frames.length}프레임`)
}

/** 화면 왼쪽 아래에 지금 보여 주는 내용을 짧게 띄웁니다. */
async function caption(page, text) {
  await page.evaluate((value) => {
    let el = document.getElementById('demo-caption')
    if (!el) {
      el = document.createElement('div')
      el.id = 'demo-caption'
      Object.assign(el.style, {
        position: 'fixed',
        left: '24px',
        bottom: '24px',
        zIndex: 99999,
        padding: '10px 16px',
        borderRadius: '10px',
        background: 'rgba(17, 17, 17, 0.82)',
        color: '#fff',
        font: '600 15px/1.4 Pretendard, -apple-system, sans-serif',
        pointerEvents: 'none',
      })
      document.body.appendChild(el)
    }
    el.textContent = value
  }, text)
}

async function go(page, path, text) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
  await caption(page, text)
  await wait(2200)
}

/** 사람이 스크롤하듯 여러 번에 나눠 내립니다. */
async function scroll(page, distance, steps = 8) {
  for (let i = 0; i < steps; i += 1) {
    await page.mouse.wheel(0, distance / steps)
    await wait(120)
  }
  await wait(900)
}

async function typeSlowly(locator, text) {
  await locator.click()
  await locator.pressSequentially(text, { delay: 35 })
}

// 1. 참여자: 캠페인 둘러보기 → 구매평 캠페인 상세 → 신청서 작성
await scene('01-participant-apply', 'minji', async (page) => {
  await go(page, '/home', '참여자 · 진행 중인 캠페인 둘러보기')
  await scroll(page, 320)
  await go(
    page,
    `/campaign/${coffee}`,
    '구매평 캠페인 · 결제 금액과 환급액을 함께 안내',
  )
  await scroll(page, 500)
  await go(
    page,
    `/campaign/${ids['패브릭 미스트 공간 리뷰 체험단']}`,
    '배송형 캠페인 신청서',
  )
  const message = page.getByLabel('신청 메시지')
  if (!(await message.isVisible().catch(() => false)))
    await page.getByRole('button', { name: /신청/ }).first().click()
  await message.scrollIntoViewIfNeeded()
  await typeSlowly(
    message,
    '거실과 침실 두 공간에서 향을 비교해 15초 클립으로 담아 보겠습니다.',
  )
  await page.getByLabel('수령인', { exact: true }).fill('이민지')
  await page.getByLabel('연락처', { exact: true }).fill('010-3920-1184')
  await wait(1500)
})

// 2. 참여자: 내 캠페인 작업 공간(일정·송장·콘텐츠) → 브랜드와 채팅
await scene('02-participant-workspace', 'haneul', async (page) => {
  await go(
    page,
    '/mypage/campaigns',
    '내 캠페인 · 일정, 배송, 콘텐츠 제출을 한곳에서',
  )
  await page
    .getByRole('navigation', { name: '내 캠페인 선택' })
    .getByRole('button', { name: /시카 수분 앰플/ })
    .first()
    .click()
  await wait(1200)
  await scroll(page, 1400, 12)
  await go(
    page,
    `/messages?room=${room.id}`,
    '브랜드와 1:1 채팅 · 사진·영상 첨부, 읽음 표시',
  )
  await typeSlowly(
    page.getByPlaceholder(/메시지를 입력/),
    '14일차 사진까지 정리해서 오늘 올릴게요!',
  )
  await wait(1500)
})

// 3. 업체: 대시보드 → 참여자 관리(상세·평가) → 배송 → 환급
await scene('03-seller', 'studio', async (page) => {
  await go(page, '/seller/dashboard', '업체 · 오늘 확인할 업무와 모집 현황')
  await go(
    page,
    `/seller/participants?campaignId=${ampoule}`,
    '참여자 관리 · 여러 명을 한 번에 선정',
  )
  await page
    .getByRole('button', { name: new RegExp(`신청 ${haneulApp.id} 상세 보기`) })
    .click()
  await wait(1200)
  await caption(page, '참여자 상세 · 활동 등급과 완료 후 평가')
  await page.locator('dialog .participant-activity').scrollIntoViewIfNeeded()
  await wait(2200)
  await page.keyboard.press('Escape')
  await go(
    page,
    `/seller/shipping?campaignId=${ampoule}`,
    '배송 관리 · 송장 입력과 배송지 엑셀 내려받기',
  )
  await go(
    page,
    '/seller/paybacks',
    '구매평 환급 · 구매 인증 확인 후 환급 처리',
  )
  await wait(800)
})

// 4. 운영자: 콘텐츠 최종 승인 → 신고 처리
await scene('04-admin', 'admin', async (page) => {
  await go(
    page,
    '/admin/content-reviews',
    '운영자 · 업체 검토가 끝난 콘텐츠 최종 승인',
  )
  await page
    .getByPlaceholder('참여자·캠페인 이름 또는 번호')
    .fill('시카 수분 앰플')
  await wait(1500)
  await go(
    page,
    '/admin/moderation',
    '신고·제재 · 신고 당시 내용을 남겨 두고 처리',
  )
  await page.getByRole('button', { name: '보기' }).first().click()
  await wait(2500)
})

await browser.close()
