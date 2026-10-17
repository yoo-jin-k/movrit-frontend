import { requirementPayload } from './requirementModel.js'
export const emptyCampaign = () => ({
  preorderId: '',
  title: '',
  description: '',
  category: '',
  recruitmentCount: '',
  rewardDescription: '',
  startAt: '',
  endAt: '',
})
export function configuredCampaignPayload(form, condition, original = null) {
  if (!form.title?.trim()) throw new Error('모집 제목을 입력해 주세요.')
  if (
    !/^\d+$/.test(String(form.recruitmentCount)) ||
    !Number.isSafeInteger(Number(form.recruitmentCount)) ||
    Number(form.recruitmentCount) < 1
  )
    throw new Error('모집 인원을 1 이상의 정수로 입력해 주세요.')
  if (
    !form.startAt ||
    !form.endAt ||
    !Number.isFinite(Date.parse(form.startAt)) ||
    !Number.isFinite(Date.parse(form.endAt)) ||
    form.startAt >= form.endAt
  )
    throw new Error('모집 시작보다 늦은 종료일을 입력해 주세요.')
  const campaign = {
    title: form.title.trim(),
    description: form.description,
    category: form.category,
    recruitmentCount: Number(form.recruitmentCount),
    rewardDescription: form.rewardDescription,
    startAt: form.startAt,
    endAt: form.endAt,
    minFollowerCount: original?.minFollowerCount ?? 0,
  }
  if (original) {
    if (!Number.isSafeInteger(original.scheduleVersion))
      throw new Error('최신 캠페인을 다시 불러와 주세요.')
    campaign.expectedScheduleVersion = original.scheduleVersion
    for (const field of [
      'mission',
      'channelGuide',
      'scheduleGuide',
      'deliveryGuide',
      'visitGuide',
      'caution',
      'submissionRequirement',
      'selectionAnnouncedAt',
      'experienceStartAt',
      'experienceEndAt',
      'contentSubmissionStartAt',
      'contentSubmissionEndAt',
      'resultsAnnouncedAt',
    ])
      campaign[field] = original[field] ?? null
  } else {
    if (
      !/^\d+$/.test(String(form.preorderId)) ||
      !Number.isSafeInteger(Number(form.preorderId)) ||
      Number(form.preorderId) < 1
    )
      throw new Error('프리오더를 선택해 주세요.')
    campaign.preorderId = Number(form.preorderId)
  }
  const requirement = requirementPayload(condition)
  return {
    campaign,
    requirementMode: requirement ? 'SINGLE' : 'NONE',
    requirement: requirement
      ? { ...requirement, expectedVersion: condition.version ?? null }
      : null,
    ...(original
      ? { expectedRequirementVersion: condition.version ?? null }
      : {}),
  }
}
