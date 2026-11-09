// 포트폴리오 시연 영상(참여자 → 업체 → 운영자 흐름, AI 초안·제출 전 점검)을 녹화합니다.
// 준비: 통합 서버·프론트 실행, seed-portfolio.mjs 로 시연 데이터 준비
// 실행: MOVRIT_QA_PASSWORD=... node qa/portfolio/record-demo.mjs
// 결과: 저장소 바깥 movrit-portfolio-media/frames/<장면>/ 에 프레임(jpg)과 frames.txt(ffmpeg concat 목록)
//
// Playwright 녹화(recordVideo)는 별도 ffmpeg 내려받기가 필요해서, 크롬 화면 전송(CDP screencast)
// 프레임을 받아 두고 영상 변환은 ffmpeg로 따로 합니다. 예)
//   ffmpeg -f concat -safe 0 -i frames/01-participant-apply/frames.txt -vf "fps=30,format=yuv420p" 01.mp4
// ffmpeg가 없으면 macOS 기본 기능(AVFoundation)으로 장면들을 이어 붙여 변환합니다. 예)
//   swift qa/portfolio/frames-to-mp4.swift movrit-demo.mp4 frames/01-participant-apply frames/05-ai
//
// 시연 데이터를 바꾸지 않도록 신청·저장 버튼은 누르지 않고 화면 이동과 입력까지만 보여 줍니다.
import fs from 'node:fs'
import { chromium } from 'playwright-core'
import { base, call, login } from '../e2e/e2e-lib.mjs'

const out =
  process.env.MOVRIT_DEMO_OUT ||
  new URL('../../../movrit-portfolio-media/frames/', import.meta.url).pathname
// MOVRIT_DEMO_SCENES=05-ai 처럼 장면 이름(쉼표 구분)을 주면 그 장면만 다시 녹화하고 나머지 프레임은 그대로 둡니다.
const only = (process.env.MOVRIT_DEMO_SCENES || '')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean)
if (!only.length) fs.rmSync(out, { recursive: true, force: true })
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
  if (only.length && !only.includes(name)) return
  const dir = `${out}${name}/`
  fs.rmSync(dir, { recursive: true, force: true })
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
  await go(page, '/category/지역', '지역 캠페인 · 카테고리·채널로 골라 보기')
  await scroll(page, 900, 10)
  await go(
    page,
    `/campaign/${coffee}`,
    '구매평 캠페인 · 결제 금액과 환급액을 함께 안내',
  )
  await scroll(page, 500)
  // 시연 계정이 아직 신청하지 않은 모집 중 배송형 캠페인을 골라 신청서를 보여 줍니다(제출은 하지 않음).
  const applied = new Set(
    (await call(auth.minji, 'GET', '/campaigns/applications/mine')).data.map(
      (a) => a.campaignId,
    ),
  )
  const product = (
    await call(auth.minji, 'GET', '/collaborations/campaigns/open')
  ).data.find(
    (c) =>
      c.campaignType === 'PRODUCT' &&
      c.selectionMode === 'BRAND_DIRECT' &&
      !applied.has(c.id) &&
      (!c.endAt || Date.parse(c.endAt) > Date.now()),
  )
  await go(page, `/campaign/${product.id}`, '배송형 캠페인 신청서')
  const message = page.getByLabel('신청 메시지')
  if (!(await message.isVisible().catch(() => false)))
    await page.getByRole('button', { name: /신청/ }).first().click()
  await message.scrollIntoViewIfNeeded()
  await typeSlowly(
    message,
    '평소 사용 장면과 비교해 2주 동안의 변화를 사진과 함께 기록하겠습니다.',
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
  // 진행 중인 다른 캠페인의 참여 조정(참여 취소·협의 취소·기간 연장)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page
    .getByRole('navigation', { name: '내 캠페인 선택' })
    .getByRole('button', { name: /해운대 비스트로/ })
    .first()
    .click()
  await wait(1000)
  await page
    .getByRole('region', { name: '참여 조정' })
    .evaluate((el) => el.scrollIntoView({ block: 'center' }))
  await caption(page, '참여 조정 · 참여 취소, 협의 취소, 기간 연장 요청')
  await wait(2400)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.getByRole('tab', { name: '달력' }).click()
  await caption(page, '달력 보기 · 신청한 캠페인 일정을 한 달 단위로')
  await wait(2600)
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
  // 처리할 신고가 있을 때만 상세를 엽니다.
  await page
    .getByRole('button', { name: '보기' })
    .first()
    .click({ timeout: 3000 })
    .catch(() => {})
  await wait(2500)
})

// 5. AI 기능: 업체 캠페인 초안 → 참여자 제출 전 점검(실제 AI 호출 각 1회, 저장·제출은 하지 않음)
await scene('05-ai', null, async (page) => {
  // 한 장면 안에서 업체 → 참여자로 계정을 바꿉니다.
  const as = async (who) => {
    await page.goto(`${base}/home`, { waitUntil: 'domcontentloaded' })
    await page.evaluate(
      ([a, r]) => {
        sessionStorage.setItem('accessToken', a)
        localStorage.setItem('refreshToken', r)
      },
      [auth[who].accessToken, auth[who].refreshToken],
    )
  }
  await as('studio')
  await go(
    page,
    '/seller/campaigns/new',
    'AI 캠페인 초안 · 입력한 정보만으로 안내문 초안 만들기',
  )
  await typeSlowly(
    page.getByLabel('모집 제목', { exact: true }),
    '저자극 세안 폼 2주 사용 후기 체험단',
  )
  const panel = page
    .locator('fieldset', { hasText: 'AI로 초안 만들기' })
    .first()
  await panel.scrollIntoViewIfNeeded()
  await typeSlowly(
    panel.getByLabel(/제품·매장 특징/),
    '약산성 세안 폼 150ml, 민감 피부용, 거품이 촘촘하고 당김이 적음',
  )
  await panel.getByRole('button', { name: 'AI로 초안 만들기' }).click()
  await caption(
    page,
    '업체 입력 속 지시는 따르지 않고, 없는 가격·효능은 지어내지 않음',
  )
  await panel
    .locator('p[role="status"]')
    .filter({ hasText: /초안을 넣었습니다|비어 있는 칸/ })
    .waitFor({ timeout: 60000 })
  await wait(1500)
  await caption(page, '비어 있던 설명·미션·제출 요건·주의사항 칸에만 채움')
  await wait(1200)
  for (const label of ['설명', '요청사항 · 미션', '주의사항']) {
    await page
      .locator('label')
      .filter({ hasText: label })
      .locator('textarea')
      .first()
      .evaluate(
        (el) => el.scrollIntoView({ block: 'center', behavior: 'smooth' }),
        null,
        { timeout: 3000 },
      )
      .catch(() => {})
    await wait(2400)
  }

  await as('minji')
  await go(
    page,
    '/mypage/campaigns',
    'AI 제출 전 점검 · 올리기 전에 빠진 항목 확인',
  )
  await page
    .getByRole('button', { name: /패브릭 미스트 공간 리뷰 체험단/ })
    .first()
    .click()
  await wait(1000)
  const check = page.locator('fieldset', { hasText: '제출 전 점검' }).first()
  await check.evaluate((el) => el.scrollIntoView({ block: 'start' }))
  await wait(800)
  await typeSlowly(
    check.getByLabel('게시할 본문'),
    '거실 소파와 커튼에 2주 동안 뿌려 봤어요. 향이 은은하고 하루 정도 유지됩니다. 피부염도 완치되는 느낌!',
  )
  await check.getByRole('button', { name: '제출 전 점검하기' }).click()
  await caption(
    page,
    '점검 기준은 서버가 캠페인에서 읽음 · 본문은 저장하지 않음',
  )
  await check
    .locator('.my-campaign-content__precheck-result')
    .waitFor({ timeout: 60000 })
  await wait(800)
  await caption(page, '협찬 표시 누락·효능 표현·필수 언급을 항목별로 안내')
  await check
    .locator('.my-campaign-content__precheck-result')
    .evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'smooth' }))
  await wait(2500)
  await scroll(page, 500, 8)
  await wait(2000)
})

await browser.close()
