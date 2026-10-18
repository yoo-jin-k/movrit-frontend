/**
 * 체험 확인과 신청/콘텐츠 상태가 맞는 경우에만 제출 payload를 구성합니다.
 * URL 형식·길이·계정정보 포함 여부를 검사하고 재제출에는 최신 콘텐츠 버전을 전달합니다.
 */
export const MY_CONTENT_STATUS = {
  SUBMITTED: '제출 완료 · 검토 대기',
  REVISION_REQUESTED: '수정 요청',
  BRAND_APPROVED: '업체 검토 완료 · 운영자 최종 승인 대기',
  APPROVED: '운영자 최종 승인 완료',
}
// 체험 확인 전에는 제출하지 못하며, 재제출은 신청과 콘텐츠가 모두 수정 요청 상태여야 합니다.
// 콘텐츠의 신청 ID와 정수 버전도 확인하여 다른 신청의 결과가 섞이지 않게 합니다.
export function contentSubmissionAllowed(application, submission) {
  if (!application?.experienceConfirmedAt) return false
  if (submission === null) return application.status === 'ACTIVE'
  return (
    application.status === 'REVISION_REQUESTED' &&
    submission?.status === 'REVISION_REQUESTED' &&
    Number.isSafeInteger(submission.version) &&
    submission.version >= 0 &&
    String(submission.applicationId) === String(application.id)
  )
}
// 공개 http/https URL만 받고 URL 안의 계정정보는 거부합니다.
// 빈 메모는 null, 최초 제출 버전은 null로 두며 기존 버전0은 그대로 보존합니다.
export function myContentPayload(application, submission, contentUrl, note) {
  if (!contentSubmissionAllowed(application, submission))
    throw new Error(
      '현재 제출 가능한 상태가 아닙니다. 최신 내역을 확인해 주세요.',
    )
  const url = String(contentUrl || '').trim(),
    memo = String(note || '').trim()
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('올바른 콘텐츠 URL을 입력해 주세요.')
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password
  )
    throw new Error('공개 가능한 http 또는 https 콘텐츠 URL을 입력해 주세요.')
  if (url.length > 1000)
    throw new Error('콘텐츠 URL은 1,000자 이내로 입력해 주세요.')
  if (memo.length > 2000)
    throw new Error('제출 메모는 2,000자 이내로 입력해 주세요.')
  return {
    contentUrl: url,
    note: memo || null,
    expectedVersion: submission?.version ?? null,
  }
}
export function myContentLink(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null
  } catch {
    return null
  }
}

// SELECTED에서는 참여 수락, 확인 전 ACTIVE에서는 체험 확인만 노출합니다. 그 외 상태에는 명령을 만들지 않습니다.
export function myParticipationAction(application) {
  if (application?.status === 'SELECTED') return 'activate'
  if (application?.status === 'ACTIVE' && !application.experienceConfirmedAt)
    return 'experience-confirm'
  return null
}
