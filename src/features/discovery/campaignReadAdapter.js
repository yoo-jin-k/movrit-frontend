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

// 서버의 캠페인 종류 코드를 탐색 메뉴 이름(제품·지역·기자단·구매평)으로 바꿉니다.
const KIND_LABELS = {
  PRODUCT: '제품',
  LOCAL: '지역',
  REPORTER: '기자단',
  PURCHASE_REVIEW: '구매평',
}

/** 서버의 캠페인 종류 코드(PRODUCT 등)를 화면 이름(제품 등)으로 바꿉니다. 모르는 코드는 빈 문자열입니다. */
export function campaignKindLabel(type) {
  return KIND_LABELS[type] ?? ''
}

// 서버의 콘텐츠 채널 코드를 미디어 필터 이름으로 바꿉니다.
const MEDIA_LABELS = {
  BLOG: '블로그',
  INSTAGRAM: '인스타그램',
  YOUTUBE: '유튜브',
  CLIP: '클립',
  OTHER: '기타',
}

// 대표 이미지는 해당 캠페인의 공개 DTO 값만 사용합니다. 미제공 채널·지역·종류는 예시 값으로 보완하지 않습니다.
export function adaptCampaignSummary(dto, now = new Date()) {
  if (!dto || dto.id == null || typeof dto.title !== 'string')
    throw new Error('캠페인 응답 형식이 올바르지 않습니다.')
  const kind = KIND_LABELS[dto.campaignType] ?? null
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
    // 지역 캠페인은 업종(맛집·숙박 등)을 지역 카테고리로도 사용합니다.
    localCategory: kind === '지역' ? dto.category || '' : null,
    region: kind === '지역' ? dto.region || null : null,
    media: MEDIA_LABELS[dto.contentChannel] ?? null,
    kind,
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
    premier: dto.premier === true,
    // 구매평 메뉴(/special/shoppingreview)는 구매평 유형 캠페인만 보여줍니다.
    shoppingreview: dto.campaignType === 'PURCHASE_REVIEW',
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
