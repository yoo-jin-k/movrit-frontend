/**
 * 업체 화면에서 사용하는 인증 목록 조회와 신청/콘텐츠 처리 명령을 전달합니다.
 * 목록 응답이 배열인지 확인하고 소유권·상태 전이 판정은 서버에 맡깁니다.
 */
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
// 업체의 선정 편집(선정 취소·미선정 되돌리기·참여 취소)을 요청합니다.
export async function manageApplication(id, payload) {
  if (!['unselect', 'restore', 'cancel'].includes(payload.action))
    throw new Error('지원하지 않는 선정 편집입니다.')
  return (await api.patch(`/campaigns/applications/${id}/manage`, payload)).data
}
export async function reviewContent(id, action, payload) {
  if (!['approve', 'request-revision'].includes(action))
    throw new Error('지원하지 않는 검토입니다.')
  return (await api.patch(`/campaign-contents/${id}/${action}`, payload)).data
}
