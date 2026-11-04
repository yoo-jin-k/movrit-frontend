/**
 * 휴대폰 번호 인증 화면 규칙입니다(화면 없이 테스트할 수 있도록 분리).
 * 서버와 같은 기준(010·011·016·017·018·019, 하이픈·공백 허용)으로 먼저 확인하고, 최종 판단은 서버가 합니다.
 */

const MOBILE = /^01[016789][0-9]{7,8}$/

export function phoneDigits(value) {
  return String(value ?? '').replace(/[\s-]/g, '')
}

export function phoneError(value) {
  const digits = phoneDigits(value)
  if (!digits) return '휴대폰 번호를 입력해 주세요.'
  if (!MOBILE.test(digits))
    return '휴대폰 번호를 확인해 주세요. 예: 010-1234-5678'
  return ''
}

export function codeError(value) {
  return /^[0-9]{6}$/.test(String(value ?? '').trim())
    ? ''
    : '인증번호 6자리를 입력해 주세요.'
}

// 입력 중인 번호를 010-1234-5678 모양으로 보여 줍니다(숫자만 남겨 11자리까지).
export function formatPhoneInput(value) {
  const digits = String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  const middle = digits.length === 10 ? 3 : 4
  return `${digits.slice(0, 3)}-${digits.slice(3, 3 + middle)}-${digits.slice(3 + middle)}`
}

// 남은 시간 표시입니다. 예) 4:05
export function remainingText(seconds) {
  const safe = Math.max(0, Math.floor(seconds))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}
