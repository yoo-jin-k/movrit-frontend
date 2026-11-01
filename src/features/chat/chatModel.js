/**
 * 채팅 화면의 표시 규칙입니다(화면 없이 테스트할 수 있도록 분리).
 */

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

// 목록·말풍선에 쓰는 시각 표시입니다. 오늘이면 시:분, 아니면 월/일 시:분입니다.
export function chatTime(value, now = new Date()) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const time = date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const sameDay = date.toDateString() === now.toDateString()
  return sameDay ? time : `${date.getMonth() + 1}/${date.getDate()} ${time}`
}

// 방 종류 표시입니다.
export function roomTypeLabel(type) {
  return type === 'SUPPORT' ? '운영자 문의' : '캠페인 대화'
}
