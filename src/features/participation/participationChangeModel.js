/**
 * 참여 조정(신청 철회·참여 취소·기간 연장)과 '내 캠페인' 월 달력의 화면 규칙입니다.
 * 가능 여부는 서버의 changes 응답을 그대로 쓰고, 여기서는 입력 확인·문구·달력 일정만 계산합니다.
 */
import { seoulDay } from '../discovery/scheduleModel.js'

export const EXTENSION_DAYS = [7, 14]
export const CANCEL_LIMIT_FALLBACK = 5
export const REQUEST_STATUS = {
  REQUESTED: '확인 대기',
  APPROVED: '승인',
  REJECTED: '반려',
}
const EVIDENCE_TYPES = ['image/jpeg', 'image/png']
const EVIDENCE_MAX = 5 * 1024 * 1024

// 단순 취소·협의 취소·연장 요청의 사유는 필수이고 500자까지입니다. 철회 사유는 선택입니다.
export function reasonError(reason, { required = true } = {}) {
  const text = String(reason ?? '').trim()
  if (required && !text) return '사유를 입력해 주세요.'
  if (text.length > 500) return '사유는 500자 이내로 입력해 주세요.'
  return ''
}

export function evidenceError(file) {
  if (!file) return '협의 내용을 확인할 수 있는 이미지를 첨부해 주세요.'
  if (!EVIDENCE_TYPES.includes(file.type))
    return '증빙 이미지는 JPG·PNG 파일만 올릴 수 있습니다.'
  if (file.size > EVIDENCE_MAX) return '증빙 이미지는 5MB 이하로 올려 주세요.'
  return ''
}

export function extensionError(days, reason) {
  if (!EXTENSION_DAYS.includes(Number(days)))
    return '연장 기간은 7일 또는 14일 중에서 골라 주세요.'
  return reasonError(reason)
}

// 업체·운영자 직접 연장은 1~30일, 사유 필수입니다. 횟수 제한은 없지만 모든 연장이 참여자 연장 횟수로 남습니다.
export const DIRECT_EXTENSION_MIN = 1
export const DIRECT_EXTENSION_MAX = 30
export const EXTENSION_SOURCE = {
  PARTICIPANT_REQUEST: '참여자 요청 승인',
  SELLER: '업체 직접 연장',
  ADMIN: '운영자 직접 연장',
}

export function directExtensionError(days, reason) {
  const value = Number(days)
  if (
    !Number.isInteger(value) ||
    value < DIRECT_EXTENSION_MIN ||
    value > DIRECT_EXTENSION_MAX
  )
    return `연장 일수는 ${DIRECT_EXTENSION_MIN}일부터 ${DIRECT_EXTENSION_MAX}일까지 정할 수 있습니다.`
  return reasonError(reason)
}

// 연장 횟수 안내입니다. 예) 최근 1년 3회 · 전체 4회
export function extensionCountText(yearCount = 0, totalCount = 0) {
  return `최근 1년 ${yearCount ?? 0}회 · 전체 ${totalCount ?? 0}회`
}

// 연장 횟수 기준 안내입니다. 예) 기준 3/10회 · 5회부터 운영자 알림, 10회면 패널티 1회와 30일 신청 제한
export const EXTENSION_WARN_AT = 5
export const EXTENSION_LIMIT_AT = 10
export function extensionLimitText(
  count = 0,
  warnAt = EXTENSION_WARN_AT,
  limitAt = EXTENSION_LIMIT_AT,
) {
  return `기준 ${count ?? 0}/${limitAt}회 · ${warnAt}회부터 운영자 알림, ${limitAt}회면 패널티 1회와 30일 신청 제한(1년 안 연장, 패널티로 바뀌면 0회부터)`
}

// 'warn': 운영자 알림 기준 이상, '': 그 아래
export function extensionLevel(count = 0, warnAt = EXTENSION_WARN_AT) {
  return Number(count) >= Number(warnAt) ? 'warn' : ''
}

// 취소 횟수 안내입니다. 예) 취소 2/5회 · 5회가 되면 패널티 1회로 바뀝니다.
export function cancelCountText(count, limit = CANCEL_LIMIT_FALLBACK) {
  const used = Number(count) || 0
  const max = Number(limit) || CANCEL_LIMIT_FALLBACK
  return `취소 ${used}/${max}회 · ${max}회가 되면 패널티 1회로 바뀌고 다시 0회부터 셉니다(1년이 지난 취소는 세지 않습니다).`
}

// 서버 일시 문자열(초 단위, 시간대 없음)을 같은 기준으로 계산하려고 UTC로 읽었다가 같은 형식으로 돌려줍니다.
const asUtc = (value) => {
  const time = Date.parse(`${String(value).slice(0, 19)}Z`)
  return Number.isNaN(time) ? null : time
}

/**
 * 기간이 연장된 신청의 결과 발표일입니다. 콘텐츠 마감이 늘어 결과 발표가 마감보다 앞서게 되면, 마감이 늘어난 만큼 결과 발표도
 * 함께 미뤄 보여 줍니다(원래 마감과 결과 발표 사이 간격을 유지). 연장이 없거나 순서가 그대로면 캠페인 결과 발표일을 씁니다.
 */
export function extendedResultsAt(campaign, application) {
  const results = campaign?.resultsAnnouncedAt
  const extended = application?.contentDeadlineExtendedUntil
  const original = campaign?.contentSubmissionEndAt
  if (!results || !extended || !original) return results ?? null
  const [r, e, o] = [asUtc(results), asUtc(extended), asUtc(original)]
  if (r === null || e === null || o === null || r >= e) return results
  return new Date(r + (e - o)).toISOString().slice(0, 19)
}

// 달력에 올릴 내 일정입니다. 연장이 승인된 신청은 연장된 마감과 그에 맞춘 결과 발표일을 씁니다.
const CALENDAR_STAGES = [
  ['selection', '선정 발표', (c) => c.selectionAnnouncedAt],
  ['experience', '체험 시작', (c) => c.experienceStartAt],
  [
    'submission',
    '콘텐츠 마감',
    (c, a) => a.contentDeadlineExtendedUntil || c.contentSubmissionEndAt,
  ],
  ['results', '결과 발표', (c, a) => extendedResultsAt(c, a)],
]
const CALENDAR_HIDDEN = ['REJECTED', 'CANCELLED']

export function calendarEvents(items) {
  const events = []
  for (const { application, campaign } of items || []) {
    if (
      !application ||
      !campaign ||
      CALENDAR_HIDDEN.includes(application.status)
    )
      continue
    for (const [stage, label, pick] of CALENDAR_STAGES) {
      // 선정 발표는 아직 선정 전인 신청에만 의미가 있습니다.
      if (stage === 'selection' && application.status !== 'SUBMITTED') continue
      const day = seoulDay(pick(campaign, application))
      if (!day) continue
      events.push({
        day,
        stage,
        label,
        applicationId: application.id,
        title: campaign.title || `캠페인 #${application.campaignId}`,
        extended:
          stage === 'submission' &&
          Boolean(application.contentDeadlineExtendedUntil),
      })
    }
  }
  return events.sort(
    (a, b) => a.day.localeCompare(b.day) || a.stage.localeCompare(b.stage),
  )
}

export function eventsOnDay(events, day) {
  return events.filter((event) => event.day === day)
}

// 처음 펼칠 달: 오늘 이후 가장 가까운 일정이 있는 달, 없으면 이번 달입니다.
export function initialCalendarMonth(events, today = seoulDay(new Date())) {
  const next = events.find((event) => event.day >= today) || null
  const [year, month] = (next?.day || today).split('-').map(Number)
  return { year, month }
}
