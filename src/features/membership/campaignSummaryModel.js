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
