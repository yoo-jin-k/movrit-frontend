/**
 * 이메일 소유 확인의 발송·번호 확인·상태 조회를 처리합니다.
 * 발송 응답의 요청 ID·마스킹 주소·만료 시각을 검사하며 인증번호 자체는 이 모듈에서 보관하지 않습니다.
 */
import api from './axios'
import { seoulInstant } from '../features/discovery/scheduleModel'

// 인증 토큰은 기존 인증 클라이언트로 전달하며 인증번호를 저장하거나 로그에 남기지 않습니다.
export async function requestEmailCode() {
  const { data, status } = await api.post(
    '/email-verifications/requests',
    undefined,
    { timeout: 15000 },
  )
  if (
    status !== 202 ||
    !data?.challengeId ||
    !data.maskedEmail ||
    !seoulInstant(data.expiresAt)
  ) {
    throw new Error(
      '인증 요청 결과를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    )
  }
  return data
}
export async function confirmEmailCode(input) {
  const { data } = await api.post('/email-verifications/confirm', input, {
    timeout: 15000,
  })
  return data
}
export async function readEmailStatus(signal) {
  const { data } = await api.get('/email-verifications/status', {
    signal,
    timeout: 15000,
  })
  if (typeof data?.emailVerified !== 'boolean')
    throw new Error('이메일 인증 상태를 확인할 수 없습니다.')
  return data
}
