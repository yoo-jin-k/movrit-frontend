/**
 * 운영자 '캠페인 참여자 선정' 화면(/admin/campaign-participants)의 표시·판단 규칙입니다.
 * 화면 없이 테스트할 수 있도록 분리했습니다.
 *
 * - 서버 API: GET /api/admin/campaign-applications (운영자 선정 방식 캠페인의 신청, 채널 지표·완료 이력 포함)
 *   PATCH /api/admin/campaign-applications/{id}/select|reject
 * - 배송 연락처는 참여 수락 전에는 서버가 내려주지 않습니다. 화면도 연락처를 따로 꾸며 보여주지 않습니다.
 */
import {
  channelLabel,
  completedCountLabel,
  metricValueLabel,
} from '../business/participantPortfolioModel.js'
import { metricVerificationLabel } from '../membership/channelProfileModel.js'

export { channelLabel, completedCountLabel, metricValueLabel }

export const APPLICATION_STATUS_FILTERS = [
  'SUBMITTED',
  'SELECTED',
  'ACTIVE',
  'REJECTED',
  'CANCELLED',
  'CONTENT_SUBMITTED',
  'REVISION_REQUESTED',
  'COMPLETED',
]

export const FULFILLMENT_LABELS = {
  DELIVERY: '배송',
  VISIT: '방문',
  PURCHASE: '직접 구매',
}

/** 상태 배지 색입니다. 접수는 처리할 일이 있는 상태라 warning입니다. */
export function applicationTone(status) {
  if (['ACTIVE', 'SELECTED', 'COMPLETED'].includes(status)) return 'success'
  if (['REJECTED', 'CANCELLED'].includes(status)) return 'danger'
  if (['SUBMITTED', 'REVISION_REQUESTED'].includes(status)) return 'warning'
  return 'neutral'
}

/** 표에 넣을 지표 한 줄씩입니다. 지표가 배열이 아니면(이전 서버) null을 돌려 '확인 필요'로 보여줍니다. */
export function metricLines(metrics) {
  if (!Array.isArray(metrics)) return null
  return metrics.map((metric) => ({
    key: `${metric.channelType}-${metric.metricType}`,
    channel: channelLabel(metric.channelType),
    text: `${metric.metricName || '지표'} ${metricValueLabel(metric.value)}`,
    verification: metricVerificationLabel(metric.verificationStatus),
  }))
}

/** 신청 시점 준비 상태(이메일·본인 인증·채널)를 [항목, 완료 여부] 목록으로 만듭니다. */
export function readinessItems(item = {}) {
  const items = [
    ['이메일 인증', Boolean(item.emailVerified)],
    ['활동 채널 등록', Boolean(item.channelReady)],
  ]
  // 본인 인증 기능이 아직 켜지지 않았다면 항목 자체를 빼서 '미완료'로 오해하지 않게 합니다.
  if (item.identityVerificationConfigured)
    items.push(['본인 인증', Boolean(item.identityVerified)])
  return items
}

/** 검색어(참여자 닉네임·캠페인 이름·번호)와 상태로 목록을 거릅니다. */
export function filterApplications(rows = [], { status = '', search = '' }) {
  const query = search.trim().toLowerCase()
  return rows.filter(
    (item) =>
      (!status || item.status === status) &&
      `${item.creatorNickname || ''} ${item.campaignTitle || ''} ${item.campaignId} ${item.id}`
        .toLowerCase()
        .includes(query),
  )
}

/** 선정·미선정 처리 뒤 상세 창에 보여줄 결과 문구입니다. */
export function actionResultMessage(action, item = {}) {
  const who = item.creatorNickname
    ? `${item.creatorNickname} 님을`
    : `신청 #${item.id}을`
  return action === 'select'
    ? `${who} 선정했습니다. 참여자가 수락하면 참여가 시작됩니다.`
    : `${who} 미선정 처리했습니다.`
}

/**
 * 처리 응답으로 상세 내용을 갱신합니다. 처리 응답에는 지표·완료 이력이 없으므로 기존 값을 유지합니다.
 */
export function mergeActionResult(selected, response) {
  if (!response || typeof response !== 'object' || response.id !== selected.id)
    return selected
  return {
    ...selected,
    ...response,
    creatorMetrics: Array.isArray(response.creatorMetrics)
      ? response.creatorMetrics
      : selected.creatorMetrics,
    completedCampaignCount:
      response.completedCampaignCount ?? selected.completedCampaignCount,
  }
}

/** 처리 실패 안내입니다. */
export function actionErrorMessage(status) {
  if (status === 403)
    return '이 신청을 처리할 운영자 권한 또는 선정 방식을 확인해 주세요.'
  if (status === 409)
    return '상태 또는 정원이 변경되었습니다. 최신 목록을 확인해 주세요.'
  return '처리 결과를 확인하지 못했습니다. 최신 목록에서 확인해 주세요.'
}
