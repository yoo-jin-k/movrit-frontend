/**
 * 마이페이지 '나의 캠페인' 요약 모델입니다.
 * 신청·선정·진행·완료 네 단계 건수를 보여주기 위해 서버 신청 상태를 단계로 묶습니다.
 * 미선정(REJECTED)과 취소(CANCELLED)는 진행 중인 활동이 아니므로 어느 단계에도 세지 않습니다.
 */

// 화면에 표시할 단계 순서와 각 단계에 포함되는 서버 상태입니다.
export const CAMPAIGN_STAGES = [
  { key: 'applied', label: '신청', statuses: ['SUBMITTED'] },
  { key: 'selected', label: '선정', statuses: ['SELECTED'] },
  {
    key: 'progress',
    label: '진행',
    statuses: ['ACTIVE', 'CONTENT_SUBMITTED', 'REVISION_REQUESTED'],
  },
  { key: 'completed', label: '완료', statuses: ['COMPLETED'] },
]

// 단계 요약을 누르면 내 캠페인 목록을 그 단계로 걸러 보여주는 주소입니다.
// 상태가 하나인 단계는 ?status=, 여러 상태를 묶은 단계(진행)는 ?stage=로 보냅니다.
export function stageLink(stage) {
  return stage.statuses.length === 1
    ? `/mypage/campaigns?status=${stage.statuses[0]}`
    : `/mypage/campaigns?stage=${stage.key}`
}

// 주소의 ?stage= 또는 ?status= 값을 목록 필터로 바꿉니다. 모르는 값은 전체 보기('')로 둡니다.
export function filterFromParams(params, knownStatuses) {
  const stage = CAMPAIGN_STAGES.find(
    (item) => item.key === params.get('stage') && item.statuses.length > 1,
  )
  if (stage) return `stage:${stage.key}`
  const status = params.get('status') || ''
  return knownStatuses.includes(status) ? status : ''
}

// 신청 상태가 고른 필터에 맞는지 봅니다. 'stage:키'는 그 단계에 묶인 상태 모두를 포함합니다.
export function matchesFilter(status, filter) {
  if (!filter) return true
  if (filter.startsWith('stage:')) {
    const stage = CAMPAIGN_STAGES.find((item) => `stage:${item.key}` === filter)
    return Boolean(stage?.statuses.includes(status))
  }
  return status === filter
}

// 필터 값을 주소 값으로 되돌립니다. 목록에서 필터를 바꾸면 주소도 같이 바뀌어 새로고침·뒤로 가기에도 유지됩니다.
export function paramsFromFilter(filter) {
  if (!filter) return {}
  return filter.startsWith('stage:')
    ? { stage: filter.slice('stage:'.length) }
    : { status: filter }
}

// 신청 목록을 단계별 건수로 집계합니다. 목록 형식이 아니면 0건으로 위장하지 않고 null을 반환합니다.
export function summarizeCampaignStages(applications) {
  if (!Array.isArray(applications)) return null
  return CAMPAIGN_STAGES.map(({ key, label, statuses }) => ({
    key,
    label,
    // 단일 상태 단계만 내 캠페인 화면의 상태 필터로 바로 연결합니다.
    status: statuses.length === 1 ? statuses[0] : null,
    count: applications.filter((item) => statuses.includes(item?.status))
      .length,
  }))
}
