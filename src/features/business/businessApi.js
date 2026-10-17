import api from '../../api/axios'
// 모든 업무 조회는 인증된 판매자 전용 목록입니다. 소유권과 상태 전이는 서버에서 재검증합니다.
export async function readBusinessList(path, signal) {
  const { data } = await api.get(path, { signal, timeout: 15000 })
  if (!Array.isArray(data))
    throw new Error('목록 응답 형식을 확인할 수 없습니다.')
  return data
}
export async function actOnApplication(id, action) {
  if (!['select', 'reject'].includes(action))
    throw new Error('지원하지 않는 처리입니다.')
  return (await api.patch(`/campaigns/applications/${id}/${action}`)).data
}
export async function reviewContent(id, action, payload) {
  if (!['approve', 'request-revision'].includes(action))
    throw new Error('지원하지 않는 검토입니다.')
  return (await api.patch(`/campaign-contents/${id}/${action}`, payload)).data
}
