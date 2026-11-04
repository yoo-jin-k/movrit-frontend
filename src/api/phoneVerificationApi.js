/**
 * 휴대폰 번호 인증 API입니다: 인증번호 발송 · 확인 · 상태 조회.
 * 인증번호는 화면 상태에만 잠깐 두고 저장하거나 로그에 남기지 않습니다(시연 모드에서만 응답에 담겨 옵니다).
 */
import api from './axios'

export async function readPhoneStatus(signal) {
  const { data } = await api.get('/phone-verifications/status', {
    signal,
    timeout: 15000,
  })
  if (typeof data?.phoneVerified !== 'boolean')
    throw new Error('휴대폰 인증 상태를 확인할 수 없습니다.')
  return data
}

export async function requestPhoneCode(phone) {
  const { data, status } = await api.post(
    '/phone-verifications/requests',
    { phone },
    { timeout: 15000 },
  )
  if (status !== 202 || !data?.challengeId || !data.maskedPhone)
    throw new Error('인증번호 요청 결과를 확인할 수 없습니다.')
  return data
}

export async function confirmPhoneCode(challengeId, code) {
  const { data } = await api.post(
    '/phone-verifications/confirm',
    { challengeId, code },
    { timeout: 15000 },
  )
  return data
}
