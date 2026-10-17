export const MY_CONTENT_STATUS = {
  SUBMITTED: '제출 완료 · 검토 대기',
  REVISION_REQUESTED: '수정 요청',
  BRAND_APPROVED: '업체 검토 완료 · 운영자 최종 승인 대기',
  APPROVED: '운영자 최종 승인 완료',
}
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

export function myParticipationAction(application) {
  if (application?.status === 'SELECTED') return 'activate'
  if (application?.status === 'ACTIVE' && !application.experienceConfirmedAt)
    return 'experience-confirm'
  return null
}
