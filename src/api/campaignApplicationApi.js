/**
 * 참여자 본인의 캠페인 신청 조회와 신청 제출입니다.
 * - 사용하는 API: GET /api/campaigns/applications/mine, GET …/mine/workspaces, POST /api/campaigns/{id}/applications
 * - 권한: 로그인한 참여자 본인. 신청 가능 여부·정원·조건은 서버가 판단합니다(409 등).
 * - 응답 형식이 다르면 빈 목록이나 성공으로 꾸미지 않고 오류로 돌려줍니다.
 * - 변경 이력: 화면(MyCampaignsPage·MyCampaignSummary·AccountActivity·LiveApplicationForm)이
 *   axios를 직접 부르던 것 → 이 파일의 함수로 모으고 응답 형식 검사도 함께 옮겼습니다.
 */
import api from './axios'

const options = (signal) => ({ signal, timeout: 15000 })

// 내 신청 목록입니다. 배열이 아니면 오류입니다.
export async function readMyApplications(signal) {
  const { data } = await api.get(
    '/campaigns/applications/mine',
    options(signal),
  )
  if (!Array.isArray(data))
    throw new Error('신청 목록 형식을 확인할 수 없습니다.')
  return data
}

// 내 캠페인 작업공간(신청·캠페인·콘텐츠 묶음)입니다.
// 부분 응답을 제출 전 상태로 오해하지 않도록 항목마다 신청·캠페인 ID와 content 칸이 있는지 확인합니다.
export async function readMyWorkspaces(signal) {
  const { data } = await api.get(
    '/campaigns/applications/mine/workspaces',
    options(signal),
  )
  if (
    !Array.isArray(data) ||
    data.some(
      (item) =>
        !item.application?.id ||
        !item.campaign?.id ||
        !Object.hasOwn(item, 'content'),
    )
  )
    throw new Error('작업공간 응답을 확인할 수 없습니다.')
  return data
}

// 캠페인 신청을 보냅니다. 201과 신청 ID가 확인된 경우에만 성공으로 돌려줍니다.
export async function submitCampaignApplication(campaignId, payload) {
  const { data, status } = await api.post(
    `/campaigns/${encodeURIComponent(campaignId)}/applications`,
    payload,
    { timeout: 15000 },
  )
  if (status !== 201 || !data?.id)
    throw new Error(
      '신청 결과를 확인할 수 없습니다. 신청 내역을 확인해 주세요.',
    )
  return data
}
