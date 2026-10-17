import api from './axios'
// 본인 전용 목록과 제출 API만 사용합니다. 업체/운영자 검토 명령은 이 모듈에 두지 않습니다.
export async function readMyCampaignContents(signal) {
  const { data } = await api.get('/campaign-contents/mine', {
    signal,
    timeout: 15000,
  })
  if (!Array.isArray(data)) throw new Error('콘텐츠 내역을 확인할 수 없습니다.')
  return data
}
export async function submitMyCampaignContent(applicationId, payload) {
  const { data } = await api.post(
    `/campaign-contents/applications/${encodeURIComponent(applicationId)}`,
    payload,
    { timeout: 15000 },
  )
  if (
    !data ||
    String(data.applicationId) !== String(applicationId) ||
    !Number.isSafeInteger(data.version)
  )
    throw new Error('제출 결과를 확인할 수 없습니다.')
  return data
}

export async function updateMyParticipation(applicationId, action) {
  if (!['activate', 'experience-confirm'].includes(action))
    throw new Error('지원하지 않는 참여 처리입니다.')
  const { data } = await api.patch(
    `/campaigns/applications/${encodeURIComponent(applicationId)}/${action}`,
    undefined,
    { timeout: 15000 },
  )
  if (!data || String(data.id) !== String(applicationId))
    throw new Error('참여 처리 결과를 확인할 수 없습니다.')
  return data
}
