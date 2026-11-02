/**
 * 커뮤니티 화면의 게시판·분류 규칙과 입력 검사입니다(화면 없이 테스트할 수 있도록 분리).
 */
export const BOARDS = [
  ['guide', 'MOVRIT 소식'],
  ['free', 'MOVRIT 톡톡'],
  ['neighbor', '우리 친구할까요?'],
  ['event', '이벤트'],
]

// 회원 누구나 글을 쓸 수 있는 게시판입니다(나머지는 운영자만).
export const MEMBER_BOARDS = ['free', 'neighbor']

export const CATEGORIES = ['일상', '체험단', '정보공유', '질문하기']

// 서버 글 번호는 숫자, 안내 글(고정)은 영문 이름입니다.
export function isServerPostId(value) {
  return /^\d+$/.test(String(value || ''))
}

// 글 입력을 확인합니다. 문제가 있으면 안내 문구, 없으면 빈 문자열입니다.
export function postFormError({ title, body }) {
  const t = String(title || '').trim()
  const b = String(body || '').trim()
  if (t.length < 2) return '제목을 2자 이상 입력해 주세요.'
  if (t.length > 100) return '제목은 100자 이내로 입력해 주세요.'
  if (b.length < 5) return '내용을 5자 이상 입력해 주세요.'
  if (b.length > 5000) return '내용은 5,000자 이내로 입력해 주세요.'
  return ''
}

// 게시글 날짜 표시입니다(예: 2026.11.02).
export function postDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}
