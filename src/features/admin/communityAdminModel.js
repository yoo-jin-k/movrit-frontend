/**
 * 운영자 커뮤니티 관리 화면의 표시 규칙입니다(게시판·상태 이름, 버튼 문구, 오류 문구).
 */

export const COMMUNITY_BOARDS = [
  ['', '전체 게시판'],
  ['free', 'MOVRIT 톡톡'],
  ['neighbor', '우리 친구할까요?'],
  ['guide', 'MOVRIT 소식'],
  ['event', '이벤트'],
]

export const COMMUNITY_STATUSES = [
  ['ALL', '전체'],
  ['VISIBLE', '보이는 글'],
  ['HIDDEN', '가린 글'],
  ['DELETED', '지운 글'],
]

export const VISIBILITY_LABELS = {
  VISIBLE: '보임',
  HIDDEN: '가림',
  DELETED: '삭제됨',
}

export function boardLabel(code) {
  return COMMUNITY_BOARDS.find(([value]) => value === code)?.[1] || code
}

/** 상태에 따라 누를 수 있는 버튼입니다. 지운 글·댓글은 바꿀 수 없어 null입니다. */
export function visibilityAction(status) {
  if (status === 'VISIBLE') return { hidden: true, label: '가리기' }
  if (status === 'HIDDEN') return { hidden: false, label: '다시 보이기' }
  return null
}

/** 목록 한 줄의 보조 문구입니다. 가린 댓글이 있으면 함께 알려 줍니다. */
export function postMeta(post) {
  const parts = [`조회 ${post.viewCount}`, `댓글 ${post.commentCount}`]
  if (post.hiddenCommentCount > 0)
    parts.push(`가린 댓글 ${post.hiddenCommentCount}`)
  return parts.join(' · ')
}

/** 서버 오류를 화면 문구로 바꿉니다. 409는 서버가 준 이유(이미 가림·지운 글 등)를 그대로 씁니다. */
export function visibilityError(error) {
  const status = error?.response?.status
  const detail = error?.response?.data?.detail
  if (status === 409 && detail) return detail
  if (status === 403) return '운영자만 바꿀 수 있습니다.'
  if (status === 404)
    return '글이나 댓글을 찾을 수 없습니다. 목록을 새로고침해 주세요.'
  return '바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.'
}
