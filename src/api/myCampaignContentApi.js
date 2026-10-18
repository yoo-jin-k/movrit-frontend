/**
 * 본인 콘텐츠 목록·제출과 참여 수락·체험 확인 명령을 제공합니다.
 * 제출 응답은 신청 ID와 버전을 확인하고, 참여 명령은 허용한 두 동작만 전송합니다.
 */
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
// 응답의 신청 ID와 버전을 확인한 뒤 반환합니다. 연결 오류 시 저장됐는지는 부모가 재조회해야 합니다.
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

// 허용된 참여 수락·체험 확인 외의 동작 이름은 네트워크 요청 전에 차단합니다.
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
