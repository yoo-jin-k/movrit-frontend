/**
 * 채팅 화면의 표시 규칙입니다(화면 없이 테스트할 수 있도록 분리).
 */
import { seoulInstant } from '../discovery/scheduleModel.js'

export const CHAT_ROLE_LABELS = {
  CREATOR: '참여자',
  BRAND: '브랜드',
  ADMIN: '운영자',
  MEMBER: '회원',
}

export const MAX_CHAT_LENGTH = 2000

// 보낼 메시지를 확인합니다. 문제가 있으면 안내 문구를, 없으면 빈 문자열을 돌려줍니다.
export function chatInputError(text) {
  const value = String(text || '').trim()
  if (!value) return '메시지를 입력해 주세요.'
  if (value.length > MAX_CHAT_LENGTH)
    return `메시지는 ${MAX_CHAT_LENGTH.toLocaleString('ko-KR')}자까지 보낼 수 있습니다.`
  return ''
}

// 새로 받은 메시지를 기존 목록에 합칩니다. 같은 번호는 한 번만 두고 번호 순으로 정렬합니다(보내기 응답과 새 메시지 확인이 겹쳐도 중복되지 않습니다).
export function mergeMessages(current, incoming) {
  const byId = new Map()
  for (const message of [...(current || []), ...(incoming || [])])
    if (message?.id != null) byId.set(message.id, message)
  return [...byId.values()].sort((a, b) => a.id - b.id)
}

// 새 메시지 확인을 시작할 번호입니다. 마지막 메시지가 아니라 끝에서 overlap개 앞부터 겹쳐 받습니다.
// 두 사람이 거의 동시에 보내면 번호가 작은 메시지가 늦게 저장될 수 있어, 마지막 번호 다음만 받으면 그 메시지를 영영 놓치기 때문입니다.
// 겹쳐 받은 메시지는 mergeMessages가 번호로 합칩니다. 메시지가 overlap개 이하면 처음부터(null) 받습니다.
export function pollAfterId(messages, overlap = 5) {
  const ids = (messages || [])
    .map((m) => Number(m?.id))
    .filter((id) => Number.isFinite(id) && id > 0)
    .sort((a, b) => a - b)
  if (ids.length <= overlap) return null
  return ids[ids.length - 1 - overlap]
}

// 받은 메시지 중 화면에 아직 없던 것만 고릅니다(겹쳐 받은 메시지로 새 메시지 알림이 반복되지 않게).
export function unseenMessages(current, incoming) {
  const known = new Set((current || []).map((m) => m?.id))
  return (incoming || []).filter((m) => m?.id != null && !known.has(m.id))
}

// 목록·말풍선에 쓰는 시각 표시입니다. 오늘이면 시:분, 아니면 월/일 시:분입니다.
// 서버 시각(오프셋 없음)은 서울 시간이고, 화면도 기기 시간대와 관계없이 서울 기준으로 보여 줍니다.
const SEOUL_TIME = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
})
const SEOUL_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
  year: 'numeric',
})

function seoulParts(date) {
  return Object.fromEntries(
    SEOUL_DAY.formatToParts(date).map(({ type, value }) => [type, value]),
  )
}

export function chatTime(value, now = new Date()) {
  if (!value) return ''
  const date =
    value instanceof Date ? value : (seoulInstant(value) ?? new Date(value))
  if (Number.isNaN(date.getTime())) return ''
  const time = SEOUL_TIME.format(date)
  const day = seoulParts(date)
  const today = seoulParts(now)
  const sameDay =
    day.year === today.year &&
    day.month === today.month &&
    day.day === today.day
  return sameDay ? time : `${Number(day.month)}/${Number(day.day)} ${time}`
}

// 방 종류 표시입니다.
export function roomTypeLabel(type) {
  return type === 'SUPPORT' ? '운영자 문의' : '캠페인 대화'
}

// 첨부 파일 선택을 확인합니다. 사진(JPG·PNG)·PDF는 5MB, 영상(MP4·MOV·WebM)은 20MB까지 보낼 수 있습니다.
export const CHAT_IMAGE_TYPES = ['image/jpeg', 'image/png']
export const CHAT_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
export const CHAT_ATTACHMENT_TYPES = [
  ...CHAT_IMAGE_TYPES,
  'application/pdf',
  ...CHAT_VIDEO_TYPES,
]
export const MAX_CHAT_FILES = 10
const MB = 1024 * 1024

export function chatAttachmentError(file) {
  if (!file) return '첨부할 파일을 선택해 주세요.'
  if (!CHAT_ATTACHMENT_TYPES.includes(file.type))
    return '사진(JPG·PNG), PDF, 영상(MP4·MOV·WebM)만 보낼 수 있습니다.'
  if (CHAT_VIDEO_TYPES.includes(file.type)) {
    if (file.size > 20 * MB) return '영상은 20MB 이하만 보낼 수 있습니다.'
  } else if (file.size > 5 * MB)
    return '사진·PDF는 5MB 이하만 보낼 수 있습니다.'
  return ''
}

// 여러 파일을 한 번에 고를 때 확인합니다. 최대 10개이며, 하나라도 맞지 않으면 그 파일 이름과 이유를 알려 줍니다.
export function chatFilesError(files) {
  const list = Array.from(files || [])
  if (list.length > MAX_CHAT_FILES)
    return `한 번에 ${MAX_CHAT_FILES}개까지 보낼 수 있습니다.`
  for (const file of list) {
    const problem = chatAttachmentError(file)
    if (problem) return `${file.name}: ${problem}`
  }
  return ''
}

// 서버가 내려준 첨부 정보가 영상인지입니다.
export function isVideoAttachment(attachment) {
  return String(attachment?.contentType || '').startsWith('video/')
}

// '입력 중' 신호: 입력하는 동안 3초에 한 번만 보내고, 받은 쪽은 5초 동안 새 신호가 없으면 지웁니다.
export const TYPING_SEND_MS = 3000
export const TYPING_SHOW_MS = 5000

// 입력 중인 사람 이름 목록을 한 줄 안내로 바꿉니다.
export function typingLabel(names) {
  const list = [...new Set((names || []).filter(Boolean))]
  if (!list.length) return ''
  if (list.length === 1) return `${list[0]}님이 입력 중`
  return `${list[0]}님 외 ${list.length - 1}명이 입력 중`
}

// 검색 결과에서 검색어 부분을 강조하기 위해 글을 [일반, 일치, 일반, …] 조각으로 나눕니다(대소문자 무시).
export function highlightParts(text, query) {
  const value = String(text || '')
  const keyword = String(query || '').trim()
  if (!keyword) return [{ text: value, match: false }]
  const lower = value.toLowerCase()
  const needle = keyword.toLowerCase()
  const parts = []
  let index = 0
  for (;;) {
    const found = lower.indexOf(needle, index)
    if (found < 0) break
    if (found > index)
      parts.push({ text: value.slice(index, found), match: false })
    parts.push({ text: value.slice(found, found + needle.length), match: true })
    index = found + needle.length
  }
  if (index < value.length)
    parts.push({ text: value.slice(index), match: false })
  return parts
}

// 검색어 확인: 앞뒤 공백을 뺀 1~50자입니다.
export function chatSearchError(query) {
  const keyword = String(query || '').trim()
  if (!keyword) return '검색어를 입력해 주세요.'
  if (keyword.length > 50) return '검색어는 50자 이내로 입력해 주세요.'
  return ''
}

// 파일 크기 표시입니다(예: 1.2MB, 340KB).
export function fileSizeLabel(bytes) {
  const value = Number(bytes) || 0
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)}MB`
  return `${Math.max(1, Math.round(value / 1024))}KB`
}

// 내 메시지에 '읽음'을 붙일지입니다. 다른 참여자가 이 메시지 번호까지 읽었으면 읽음입니다.
export function isReadByOthers(message, othersLastReadId) {
  return (
    Boolean(message?.mine) && Number(othersLastReadId) >= Number(message.id)
  )
}
