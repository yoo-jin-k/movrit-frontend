/**
 * 실제 캠페인 응답을 카드 모델로 바꾸고 공개 신청 폼의 필수 구조를 확인합니다.
 * 응답에 없는 이미지·채널·지역을 예시 값으로 보완하지 않습니다.
 */
import { campaignTiming } from './campaignDates.js'
import {
  liveCampaignSchedule,
  seoulInstant,
  periodHasEnded,
  periodEndInstant,
} from './scheduleModel.js'

// 대표 이미지는 해당 캠페인의 공개 DTO 값만 사용합니다. 미제공 채널·지역·종류는 예시 값으로 보완하지 않습니다.
export function adaptCampaignSummary(dto, now = new Date()) {
  if (!dto || dto.id == null || typeof dto.title !== 'string')
    throw new Error('캠페인 응답 형식이 올바르지 않습니다.')
  return {
    id: String(dto.id),
    campaign: true,
    preview: false,
    title: dto.title,
    description: dto.description || dto.rewardDescription || '',
    category: dto.category || '',
    image:
      typeof dto.representativeImageUrl === 'string' &&
      dto.representativeImageUrl.trim()
        ? dto.representativeImageUrl
        : null,
    media: null,
    kind: null,
    capacity: dto.recruitmentCount ?? null,
    // 서버가 집계한 유효 신청 수(취소 제외)만 표시합니다. 값이 없으면 추측하지 않고 null로 둡니다.
    applicants: Number.isFinite(dto.applicationCount)
      ? dto.applicationCount
      : null,
    ...campaignTiming(
      {
        recruitmentStartsAt: seoulInstant(
          liveCampaignSchedule(dto).recruitmentStartsAt,
        )?.toISOString(),
        recruitmentEndsAt: periodEndInstant(
          liveCampaignSchedule(dto).recruitmentEndsAt,
        )?.toISOString(),
      },
      now,
    ),
    recruitmentEnded: periodHasEnded(
      liveCampaignSchedule(dto).recruitmentEndsAt,
      now,
    ),
    premier: false,
    shoppingreview: false,
    source: dto,
  }
}
// 목록 전체가 배열인지 확인한 후 항목을 동일 규칙으로 변환합니다. 잘못된 목록을 빈 성공 응답으로 취급하지 않습니다.
export function adaptCampaignList(data) {
  if (!Array.isArray(data))
    throw new Error('캠페인 목록 응답 형식이 올바르지 않습니다.')
  return data.map((dto) => adaptCampaignSummary(dto))
}

// 표시용 날짜도 서울 현지 시각인 응답 문자열을 그대로 보여줍니다.
export function displayCampaignDate(value) {
  return typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
    ? value.slice(0, 16).replace('T', ' ')
    : '미구성'
}

// 공개 폼에 없는 질문 유형·선택지·동의문 본문은 만들어 넣지 않습니다.
export function validateCampaignForm(dto) {
  if (
    !dto ||
    dto.campaignId == null ||
    dto.version == null ||
    !Array.isArray(dto.allowedFulfillmentTypes) ||
    !Array.isArray(dto.questions) ||
    !Array.isArray(dto.agreements)
  )
    throw new Error('신청 조건 응답 형식이 올바르지 않습니다.')
  if (
    dto.questions.some(
      (q) =>
        !q ||
        typeof q.id !== 'string' ||
        typeof q.label !== 'string' ||
        (q.options != null &&
          (!Array.isArray(q.options) ||
            q.options.some((option) => typeof option !== 'string'))),
    ) ||
    dto.agreements.some(
      (d) =>
        !d ||
        typeof d.id !== 'string' ||
        typeof d.title !== 'string' ||
        typeof d.version !== 'string' ||
        (d.body != null && typeof d.body !== 'string'),
    )
  )
    throw new Error('신청 문서 또는 질문 형식이 올바르지 않습니다.')
  return dto
}
