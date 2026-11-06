/**
 * 'AI로 초안 만들기' 화면 규칙입니다.
 * 서버에 보낼 요청을 만들고, 받은 초안을 업체가 아직 쓰지 않은 칸에만 넣습니다.
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
