/**
 * 본문·모집 일정과 참여 조건을 configured 요청으로 묶습니다.
 * 수정 시 기존 상세 필드를 보존하고 일정/조건 버전을 전달하여 동시 변경을 서버가 감지할 수 있게 합니다.
 */
import { requirementPayload } from './requirementModel.js'
import { selectionModeField } from '../business/selectionModeModel.js'
export const emptyCampaign = () => ({
  preorderId: '',
  selectionMode: 'BRAND_DIRECT',
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
    ...selectionModeField(form, original),
    title: form.title.trim(),
    description: form.description,
    category: form.category,
    recruitmentCount: Number(form.recruitmentCount),
    rewardDescription: form.rewardDescription,
    startAt: form.startAt,
    endAt: form.endAt,
    minFollowerCount: original?.minFollowerCount ?? 0,
  }
  // 수정 화면에서 직접 편집하지 않는 상세 필드도 기존 값으로 전달하여 본문 저장 시 유실되지 않도록 합니다.
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
