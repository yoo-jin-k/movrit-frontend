/**
 * 'AI로 초안 만들기' 화면 규칙입니다.
 * 서버에 보낼 요청을 만들고, 받은 초안을 업체가 아직 쓰지 않은 칸에만 넣습니다.
 *
 * 변경 이력(코드 리뷰 반영): 고치기 전에는 서버 설명이 없는 실패에서 'Request failed with status code 403' 같은
 * 영어 문장이 화면에 그대로 보였습니다. 고친 후에는 aiDraftError가 서버의 한국어 설명을 먼저 쓰고,
 * 없으면 상태별 한국어 안내를 보여 줍니다.
 */
import { CHANNEL_DEFAULTS } from './channelRequirementModel.js'

// AI 초안이 채우는 칸(서버 응답 필드, 화면 이름)입니다.
export const AI_DRAFT_FIELDS = [
  ['description', '설명'],
  ['mission', '요청사항 · 미션'],
  ['submissionRequirement', '제출 요구사항'],
  ['caution', '주의사항'],
]

// 작성 화면의 값으로 초안 요청을 만듭니다. 제목이 없으면 AI가 쓸 재료가 없어 먼저 안내합니다.
export function aiDraftRequest(form, highlights) {
  const title = String(form?.title || '').trim()
  if (!title) throw new Error('모집 제목을 먼저 입력해 주세요.')
  const text = (value) => {
    const trimmed = String(value || '').trim()
    return trimmed || null
  }
  return {
    title,
    campaignType: text(form.campaignType),
    category: text(form.category),
    contentChannel: text(form.contentChannel),
    rewardDescription: text(form.rewardDescription),
    highlights: text(highlights),
  }
}

// 업체가 직접 쓴 내용을 지키기 위해, 비어 있거나 채널 기본 문구 그대로인 칸에만 초안을 넣습니다.
// 돌려주는 값: 새 작성 값, 채운 칸 이름, 이미 내용이 있어 그대로 둔 칸 이름
export function applyAiDraft(form, draft) {
  const channelDefaults = CHANNEL_DEFAULTS[form?.contentChannel] || {}
  const next = { ...form }
  const filled = []
  const kept = []
  for (const [field, label] of AI_DRAFT_FIELDS) {
    const suggestion = String(draft?.[field] || '').trim()
    if (!suggestion) continue
    const current = String(form?.[field] || '')
    const untouched = !current.trim() || current === channelDefaults[field]
    if (untouched) {
      next[field] = suggestion
      filled.push(label)
    } else {
      kept.push(label)
    }
  }
  return { next, filled, kept }
}

// 상태별 기본 안내입니다. 서버가 한국어 설명(detail)을 보냈으면 그것을 먼저 씁니다.
const ERROR_BY_STATUS = {
  400: '입력한 내용을 다시 확인해 주세요.',
  401: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
  403: 'AI 초안은 승인된 업체만 사용할 수 있습니다.',
  429: '오늘 AI 초안을 모두 사용했습니다. 내일 다시 이용해 주세요.',
  502: 'AI 답을 초안으로 정리하지 못했습니다. 다시 시도해 주세요.',
  503: '지금은 AI 초안을 쓸 수 없습니다. 잠시 후 다시 시도해 주세요.',
}

// 실패를 화면 안내 문장으로 바꿉니다. 영어 오류 문장이나 외부 상태 코드를 그대로 보이지 않습니다.
export function aiDraftError(failure) {
  const detail = failure?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  const status = failure?.response?.status
  if (ERROR_BY_STATUS[status]) return ERROR_BY_STATUS[status]
  if (!failure?.response)
    return '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  return 'AI 초안을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

// 초안 받기가 끝난 뒤 버튼 옆에 보여 줄 완료 안내입니다.
// 몇 칸을 채웠는지, 이미 내용이 있어 그대로 둔 칸, 남은 횟수(또는 견본 여부)를 한 문장씩 이어 붙입니다.
export function aiDraftNotice({
  filled = [],
  kept = [],
  live,
  remainingToday,
}) {
  const parts = [
    filled.length
      ? `완료: ${filled.length}칸(${filled.join(', ')})에 초안을 넣었습니다. 읽고 캠페인에 맞게 고쳐 주세요.`
      : '완료: 비어 있는 칸이 없어 초안을 넣지 않았습니다.',
  ]
  if (kept.length)
    parts.push(`이미 쓰신 ${kept.join(', ')} 칸은 그대로 두었습니다.`)
  if (!live) parts.push('AI 키가 설정되지 않아 견본 초안을 넣었습니다.')
  else if (Number.isSafeInteger(remainingToday))
    parts.push(`오늘 ${remainingToday}번 더 만들 수 있습니다.`)
  return parts.join(' ')
}
