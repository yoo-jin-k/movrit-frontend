// E2E 공용 도구: 점검 계정 로그인(비밀번호는 환경 변수, 출력하지 않음), 로그인된 브라우저 페이지, API 호출
import { randomBytes } from 'node:crypto'
import { chromium } from 'playwright-core'

export const base = 'http://localhost:5174'
export const api = 'http://localhost:18080/api'
// 점검 계정 비밀번호는 저장소에 두지 않고 환경 변수로 받습니다.
export const password = process.env.MOVRIT_QA_PASSWORD
if (!password) throw new Error('MOVRIT_QA_PASSWORD 환경 변수를 설정해 주세요.')

// 점검 중에 새로 정하는 비밀번호(임시 가입 계정, 비밀번호 재설정)는 실행할 때마다 무작위로 만듭니다.
// 저장소·출력·로그에 남기지 않고, 영문·숫자·기호를 섞어 서버 비밀번호 규칙을 지킵니다.
export function temporaryPassword() {
  return `Qa!${randomBytes(12).toString('base64url')}7z`
}

export async function login(email) {
  const res = await fetch(`${api}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(`로그인 실패 ${email} ${res.status}`)
  return res.json()
}

export async function call(auth, method, path, body) {
  const res = await fetch(`${api}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let data = text
  try {
    data = text ? JSON.parse(text) : null
  } catch {}
  return { status: res.status, data }
}

export async function openBrowser() {
  return chromium.launch({ channel: 'chrome', headless: true })
}

// stream: 채팅 실시간 연결(/api/chats/stream)을 열지 여부입니다. 기본은 막습니다.
// 이 연결은 계속 열려 있어 'networkidle'(네트워크 조용함) 대기가 끝나지 않으므로, 실시간을 확인하는 화면에서만 켭니다.
export async function pageAs(
  browser,
  auth,
  width = 1280,
  { stream = false } = {},
) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } })
  if (auth)
    await ctx.addInitScript(
      ([a, r]) => {
        sessionStorage.setItem('accessToken', a)
        localStorage.setItem('refreshToken', r)
      },
      [auth.accessToken, auth.refreshToken],
    )
  if (!stream) await ctx.route('**/api/chats/stream', (route) => route.abort())
  const page = await ctx.newPage()
  page.errors = []
  page.on('pageerror', (e) => page.errors.push(e.message))
  return page
}
