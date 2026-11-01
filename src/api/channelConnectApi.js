/**
 * 인스타그램·유튜브·네이버 블로그 계정 연결 API입니다.
 * - 시작: 서버가 발급한 SNS 로그인 주소로 이동합니다.
 * - 완료: SNS에서 돌아온 code·state를 서버에 넘겨 계정 정보를 저장합니다.
 * - 직접 등록: 로그인 연결이 안 되는 계정(개인 인스타그램 등)은 주소·팔로워 수·프로필 캡처를 올리고 운영자 확인을 기다립니다.
 * 접근 토큰은 서버도 저장하지 않으며 화면에는 오지 않습니다.
 */
import api from './axios'

const base = '/users/me/channel-connections'

export async function readChannelConnections(signal) {
  const { data } = await api.get(base, { signal, timeout: 15000 })
  if (!Array.isArray(data))
    throw new Error('채널 연결 상태를 확인할 수 없습니다.')
  return data
}

export async function startChannelConnection(provider) {
  const { data } = await api.post(
    `${base}/${encodeURIComponent(provider)}/start`,
    undefined,
    {
      timeout: 15000,
    },
  )
  if (!data?.authorizeUrl?.startsWith('https://'))
    throw new Error('연결 주소를 확인할 수 없습니다.')
  return data.authorizeUrl
}

export async function completeChannelConnection(provider, code, state) {
  const { data } = await api.post(
    `${base}/${encodeURIComponent(provider)}/complete`,
    { code, state },
    { timeout: 30000 },
  )
  return data
}

export async function disconnectChannel(provider) {
  await api.delete(`${base}/${encodeURIComponent(provider)}`, {
    timeout: 15000,
  })
}

// 직접 등록: 캡처 파일을 함께 보내므로 multipart로 전송합니다(Content-Type은 브라우저가 정합니다).
export async function registerChannelManually(
  provider,
  { profileUrl, followerCount, file },
) {
  const body = new FormData()
  body.append('profileUrl', profileUrl)
  if (followerCount !== '' && followerCount != null)
    body.append('followerCount', String(followerCount))
  body.append('evidence', file)
  const { data } = await api.post(
    `${base}/${encodeURIComponent(provider)}/manual`,
    body,
    { headers: { 'Content-Type': undefined }, timeout: 30000 },
  )
  return data
}

// ───────── 운영자 채널 확인 ─────────
const adminBase = '/admin/channel-verifications'

// 캡처는 공개 주소가 없어 운영자 인증 요청으로 blob을 받아 화면에서 임시 주소로 보여줍니다.
export async function readChannelEvidence(id, signal) {
  const { data } = await api.get(`${adminBase}/${id}/evidence`, {
    signal,
    responseType: 'blob',
    timeout: 15000,
  })
  return data
}

export async function approveChannel(id) {
  const { data } = await api.patch(`${adminBase}/${id}/approve`, undefined, {
    timeout: 15000,
  })
  return data
}

export async function rejectChannel(id, reason) {
  const { data } = await api.patch(
    `${adminBase}/${id}/reject`,
    { reason },
    { timeout: 15000 },
  )
  return data
}
