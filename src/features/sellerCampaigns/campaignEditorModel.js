/**
 * 본문·모집 일정과 참여 조건을 configured 요청으로 묶습니다.
 * 수정 시 기존 상세 필드를 보존하고 일정/조건 버전을 전달하여 동시 변경을 서버가 감지할 수 있게 합니다.
 */
import { requirementPayload } from './requirementModel.js'
import { selectionModeField } from '../business/selectionModeModel.js'

// 참여 안내 문구 항목입니다. 사용자 캠페인 상세의 '미션과 제출 안내'에 표시됩니다.
export const GUIDE_FIELDS = [
  'mission',
  'channelGuide',
  'scheduleGuide',
  'deliveryGuide',
  'visitGuide',
  'caution',
  'submissionRequirement',
]
// 모집 이후의 세부 일정 항목입니다. 사용자 화면의 참여 일정·달력에 표시됩니다.
export const SCHEDULE_FIELDS = [
  'selectionAnnouncedAt',
  'experienceStartAt',
  'experienceEndAt',
  'contentSubmissionStartAt',
  'contentSubmissionEndAt',
  'resultsAnnouncedAt',
]
export const emptyCampaign = () => ({
  // 캠페인은 브랜드에 직접 속합니다. 프리오더는 함께 판매할 때만 고르는 선택 항목입니다.
  brandId: '',
  preorderId: '',
  selectionMode: 'BRAND_DIRECT',
  title: '',
  description: '',
  category: '',
  // 탐색 메뉴 분류: 종류(제품·지역·기자단), 지역(지역 캠페인만), 콘텐츠 채널입니다.
  campaignType: 'PRODUCT',
  region: '',
  contentChannel: '',
  recruitmentCount: '',
  rewardDescription: '',
  startAt: '',
  endAt: '',
  ...Object.fromEntries(
    [...GUIDE_FIELDS, ...SCHEDULE_FIELDS].map((field) => [field, '']),
  ),
})

// 빈 입력은 null(미정)로 바꿉니다.
const optional = (value) =>
  value == null || String(value).trim() === '' ? null : value

// 세부 일정 순서를 서버와 같은 규칙으로 먼저 확인해 저장 전에 안내합니다.
// 모집 종료 → 선정 발표 → 체험 시작 < 체험 종료, 콘텐츠 등록 시작 < 마감 → 결과 발표
function validateSchedule(form) {
  const at = (field) => (form[field] ? Date.parse(form[field]) : null)
  const end = at('endAt')
  const selection = at('selectionAnnouncedAt')
  const expStart = at('experienceStartAt')
  const expEnd = at('experienceEndAt')
  const subStart = at('contentSubmissionStartAt')
  const subEnd = at('contentSubmissionEndAt')
  const results = at('resultsAnnouncedAt')
  if (selection != null && selection < end)
    throw new Error('선정 발표일은 모집 종료일보다 빠를 수 없습니다.')
  if (expStart != null && selection != null && expStart < selection)
    throw new Error('체험 시작일은 선정 발표일보다 빠를 수 없습니다.')
  if (expStart != null && expEnd != null && expStart >= expEnd)
    throw new Error('체험 종료일은 체험 시작일보다 뒤여야 합니다.')
  if (subStart != null && subEnd != null && subStart >= subEnd)
    throw new Error('콘텐츠 등록 종료일은 시작일보다 뒤여야 합니다.')
  if (results != null && subEnd != null && results < subEnd)
    throw new Error('결과 발표일은 콘텐츠 등록 종료일보다 빠를 수 없습니다.')
}

// 화면 입력값으로 참여 안내·세부 일정 묶음을 만듭니다.
// 수정 화면에서 폼에 없는 항목(예: 이전 버전 화면)은 기존 값을 그대로 보내 유실되지 않게 합니다.
function detailValues(form, original = null) {
  return Object.fromEntries(
    [...GUIDE_FIELDS, ...SCHEDULE_FIELDS].map((field) => [
      field,
      field in form ? optional(form[field]) : (original?.[field] ?? null),
    ]),
  )
}
// 빈 값은 null(선택 안 함)로, 값이 있으면 1 이상의 정수 ID인지 확인합니다.
function optionalId(value, message) {
  if (value === '' || value == null) return null
  const id = Number(value)
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(id) || id < 1)
    throw new Error(message)
  return id
}

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
  if (form.campaignType === 'LOCAL' && !form.region)
    throw new Error('지역 캠페인은 방문 지역을 선택해 주세요.')
  validateSchedule(form)
  const campaign = {
    ...selectionModeField(form, original),
    title: form.title.trim(),
    description: form.description,
    category: form.category,
    // 지역 캠페인이 아니면 지역 값을 보내지 않습니다. 빈 채널은 null(미지정)로 보냅니다.
    campaignType: form.campaignType || 'PRODUCT',
    region: form.campaignType === 'LOCAL' ? form.region || null : null,
    contentChannel: form.contentChannel || null,
    recruitmentCount: Number(form.recruitmentCount),
    rewardDescription: form.rewardDescription,
    startAt: form.startAt,
    endAt: form.endAt,
    minFollowerCount: original?.minFollowerCount ?? 0,
  }
  // 수정: 참여 안내·세부 일정을 화면 값으로 보냅니다. 화면은 기존 상세 값으로 채워져 있어 손대지 않은 항목도 그대로 유지됩니다.
  if (original) {
    if (!Number.isSafeInteger(original.scheduleVersion))
      throw new Error('최신 캠페인을 다시 불러와 주세요.')
    campaign.expectedScheduleVersion = original.scheduleVersion
    Object.assign(campaign, detailValues(form, original))
  } else {
    // 새 캠페인: 참여 안내·세부 일정은 details로 함께 보냅니다(모두 선택).
    campaign.details = detailValues(form)
    // 새 캠페인: 운영 브랜드와 (선택) 프리오더를 숫자 ID로 보냅니다.
    // 브랜드를 비워 두면 서버가 운영 중인 브랜드가 하나일 때 그 브랜드로 정하고, 여러 개면 선택을 요청합니다.
    campaign.brandId = optionalId(
      form.brandId,
      '운영 브랜드를 다시 선택해 주세요.',
    )
    campaign.preorderId = optionalId(
      form.preorderId,
      '함께 판매할 프리오더를 다시 선택해 주세요.',
    )
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
