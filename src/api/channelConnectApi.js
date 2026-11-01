/**
 * 인스타그램·유튜브·네이버 블로그 계정 연결 API입니다.
 * - 시작: 서버가 발급한 SNS 로그인 주소로 이동합니다.
 * - 완료: SNS에서 돌아온 code·state를 서버에 넘겨 계정 정보를 저장합니다.
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
