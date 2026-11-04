// 휴대폰 번호 인증(시연 방식)을 실제 서버·화면으로 확인합니다(demo-user, 다른 회원 확인은 demo-creator).
// - 시연 환경은 문자를 보내지 않고 인증번호를 화면에 보여 줍니다.
// - 끝나면 demo-user의 연락처를 원래 값으로 되돌려 인증 상태도 처음(미인증)으로 돌립니다.
// 참고: 서버 제한(회원당 1시간 5번·재발송 1분)이 있어 한 시간에 두 번 정도까지 다시 실행할 수 있습니다.
import { base, call, login, openBrowser, pageAs } from './e2e-lib.mjs'

const user = await login('demo-user@movrit.local')
const other = await login('demo-creator@movrit.local')
const admin = await login('demo-admin@movrit.local')
const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`)
}
const TEST_PHONE = '010-5555-0101'
const me = (await call(user, 'GET', '/members/me')).data

// ───────── API: 형식 검사 ─────────
const bad = await call(user, 'POST', '/phone-verifications/requests', {
  phone: '02-123-4567',
})
check('휴대폰 번호 형식만 받음(400)', bad.status === 400, bad.data?.detail)

// ───────── 화면: 설정 > 휴대폰 인증 ─────────
const browser = await openBrowser()
const up = await pageAs(browser, user)
await up.goto(`${base}/settings`, { waitUntil: 'networkidle' })
const sec = up.locator('#phone-verify')
check(
  '설정: 휴대폰 인증 영역(미인증)',
  (await sec.innerText()).includes('인증번호 받기'),
)
await sec.getByLabel('휴대폰 번호').fill('01055550101')
check(
  '설정: 번호 입력에 하이픈 자동 표시',
  (await sec.getByLabel('휴대폰 번호').inputValue()) === TEST_PHONE,
)
await sec.getByRole('button', { name: '인증번호 받기' }).click()
await up.waitForTimeout(1000)
const preview = (
  await sec.locator('.account-phone-preview strong').innerText()
).trim()
check(
  '설정: 시연 인증번호와 남은 시간 표시',
  /^\d{6}$/.test(preview) && (await sec.innerText()).includes('남은 시간'),
  preview ? '인증번호 표시됨' : '없음',
)
await sec
  .getByLabel('인증번호')
  .fill(preview === '000000' ? '111111' : '000000')
await sec.getByRole('button', { name: '인증하기' }).click()
await up.waitForTimeout(800)
check(
  '틀린 인증번호는 안내 후 막힘',
  (await sec.locator('[role=alert]').innerText()).includes('올바르지 않습니다'),
)
await sec.getByLabel('인증번호').fill(preview)
await up.screenshot({ path: './e2e/phone_verify_form.png', fullPage: true })
await sec.getByRole('button', { name: '인증하기' }).click()
await up.waitForTimeout(1000)
check(
  '맞는 인증번호 → 인증됨과 가린 번호 표시',
  (await sec.innerText()).includes('010-****-0101') &&
    (await sec.innerText()).includes('인증됨'),
)
await sec.screenshot({ path: './e2e/phone_verified.png' })
const status = (await call(user, 'GET', '/phone-verifications/status')).data
check(
  'API 상태: 인증됨',
  status.phoneVerified === true && status.maskedPhone === '010-****-0101',
)

// ───────── 다른 회원은 같은 번호를 인증할 수 없음 ─────────
const taken = await call(other, 'POST', '/phone-verifications/requests', {
  phone: TEST_PHONE,
})
check(
  '다른 회원이 이미 인증한 번호는 409',
  taken.status === 409 && String(taken.data?.detail).includes('다른 회원'),
)

// ───────── 운영자 회원 상세 ─────────
const ap = await pageAs(browser, admin)
await ap.goto(`${base}/admin/members/${me.id}`, { waitUntil: 'networkidle' })
check(
  '운영자 회원 상세: 휴대폰 인증 완료 표시',
  /휴대폰 인증\s*완료/.test(await ap.locator('main').innerText()),
)

// ───────── 연락처를 바꾸면 다시 인증 필요 + 정리 ─────────
await call(user, 'PUT', '/members/me', {
  name: me.name,
  phone: me.phone || null,
  nickname: me.nickname,
})
check(
  '연락처를 원래 값으로 바꾸면 미인증으로 돌아감(정리)',
  (await call(user, 'GET', '/phone-verifications/status')).data
    .phoneVerified === false,
)
console.log('페이지 오류:', [...up.errors, ...ap.errors])
await browser.close()
console.log(`\n결과: ${results.filter(Boolean).length}/${results.length} 통과`)
