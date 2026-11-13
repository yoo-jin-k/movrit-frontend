/**
 * 회원가입 입력 규칙입니다(화면 없이 테스트할 수 있도록 분리).
 * - 휴대폰 번호는 숫자만 입력해도 010-1234-5678 모양으로 하이픈을 붙여 보여 줍니다.
 * - 서버 가입 규칙(빈 값 또는 숫자·+·- 8~20자)에 맞춰 하이픈이 들어간 모양으로 보냅니다.
 *   휴대폰 인증과 같은 기준(010·011·016·017·018·019)으로 먼저 확인하고, 최종 판단은 서버가 합니다.
 */
import {
  formatPhoneInput,
  phoneError,
} from '../membership/phoneVerificationModel.js'

// 입력 중인 휴대폰 번호에서 숫자만 남기고(11자리까지) 하이픈을 붙입니다.
export function signupPhoneInput(value) {
  return formatPhoneInput(value)
}

// 휴대폰 번호는 선택 사항입니다. 비어 있으면 문제가 없고, 입력했다면 휴대폰 번호 형식인지 확인합니다.
export function signupPhoneError(value) {
  if (!String(value ?? '').replace(/\D/g, '')) return ''
  return phoneError(value)
}

// 가입 요청에 넣을 번호입니다. 비어 있으면 빈 문자열, 아니면 010-1234-5678 모양입니다.
export function signupPhonePayload(value) {
  return signupPhoneInput(value)
}
