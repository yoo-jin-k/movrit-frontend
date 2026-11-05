/** 서버의 신청·제출 상태와 날짜만 사용하며 누락된 일정이나 완료 상태를 만들지 않습니다. */
import { seoulInstant } from '../discovery/scheduleModel.js'
export const APPLICATION_STATUS = {
  SUBMITTED: '신청 접수',
  SELECTED: '선정 · 참여 시작 필요',
  REJECTED: '미선정',
  ACTIVE: '선정 · 참여 중',
  CONTENT_SUBMITTED: '콘텐츠 검토 중',
  REVISION_REQUESTED: '수정 요청',
  COMPLETED: '완료',
  CANCELLED: '취소',
}
// 선정 발표 전에 참여자가 거둬들인 신청입니다. 서버는 취소(CANCELLED)로 두고 사유 앞에 [신청 철회]를 붙입니다.
export function isWithdrawn(application) {
  return (
    application?.status === 'CANCELLED' &&
    String(application.cancellationReason || '').startsWith('[신청 철회]')
  )
}
// 목록·상세의 상태 이름입니다. 철회한 신청은 '취소' 대신 '신청 철회'로 보여 줍니다.
export function applicationStatusLabel(application) {
  if (isWithdrawn(application)) return '신청 철회'
  return APPLICATION_STATUS[application?.status] || '상태 확인 필요'
}
export function workspaceTime(value) {
  const date = seoulInstant(value)
  return date
    ? new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(date)
    : '미등록'
}
export function nextCampaignAction(application, content) {
  if (content?.status === 'BRAND_APPROVED')
    return '업체 검토가 완료되었습니다. 운영자 최종 승인을 기다려 주세요.'
  if (content?.status === 'APPROVED')
    return '운영자 최종 승인이 완료되었습니다.'
  const messages = {
    SUBMITTED: '신청이 접수되었습니다. 선정 결과를 기다려 주세요.',
    SELECTED: '선정되었습니다. 아래에서 참여를 수락해 주세요.',
    ACTIVE:
      application.fulfillmentType === 'PURCHASE'
        ? application.experienceConfirmedAt
          ? '구매 인증이 완료되었습니다. 구매처에 남긴 구매평 주소를 제출해 주세요.'
          : '구매처에서 상품을 구매한 뒤 아래에서 구매 인증을 제출해 주세요.'
        : application.experienceConfirmedAt
          ? '체험 확인이 완료되었습니다. 채널별 콘텐츠 링크를 제출해 주세요.'
          : '미션과 일정을 확인하고 실제 체험 완료 후 아래에서 확인해 주세요.',
    CONTENT_SUBMITTED:
      '콘텐츠를 제출했습니다. 브랜드의 검토 결과를 기다려 주세요.',
    REVISION_REQUESTED:
      '브랜드의 수정 의견을 확인하고 콘텐츠를 재제출해 주세요.',
    COMPLETED:
      application.fulfillmentType === 'PURCHASE'
        ? '구매평이 승인되었습니다. 브랜드의 환급 진행 상태를 아래에서 확인해 주세요.'
        : '캠페인 참여가 완료되었습니다.',
    REJECTED: '이번 캠페인에 선정되지 않았습니다.',
    CANCELLED: isWithdrawn(application)
      ? '신청을 철회했습니다. 철회한 캠페인에는 다시 신청할 수 없습니다.'
      : '취소된 신청입니다.',
  }
  return messages[application.status] || '최신 참여 상태를 확인해 주세요.'
}

// 최초 제출만 등록된 시간 범위를 안내합니다. 수정 요청의 재제출은 서버 계약에 따라 마감 후에도 가능합니다.
export function submissionWindowMessage(
  campaign,
  submission,
  now = new Date(),
) {
  if (submission?.status === 'REVISION_REQUESTED') return ''
  const start = seoulInstant(campaign?.contentSubmissionStartAt)
  const end = seoulInstant(campaign?.contentSubmissionEndAt)
  if (start && now < start)
    return `콘텐츠 제출은 ${workspaceTime(campaign.contentSubmissionStartAt)}부터 가능합니다. (한국 시간)`
  if (end && now >= end)
    return '최초 콘텐츠 제출 기간이 종료되었습니다. 등록된 담당자에게 문의해 주세요.'
  return ''
}
