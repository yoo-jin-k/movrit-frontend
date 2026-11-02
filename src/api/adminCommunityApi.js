/**
 * 운영자 커뮤니티 관리 API입니다. 신고가 없어도 글·댓글을 바로 가리거나 다시 보이게 합니다.
 */
import api from './axios'

// 글 목록 한 페이지(20개)입니다. status: ALL·VISIBLE·HIDDEN·DELETED
export async function listAdminCommunityPosts(
  { board = '', status = 'ALL', q = '', page = 0 },
  signal,
) {
  const params = { status, page }
  if (board) params.board = board
  if (q.trim()) params.q = q.trim()
  const { data } = await api.get('/admin/community/posts', {
    params,
    signal,
    timeout: 15000,
  })
  return data
}

// 가린 댓글·지운 댓글까지 포함한 글 상세입니다.
export async function readAdminCommunityPost(postId, signal) {
  const { data } = await api.get(
    `/admin/community/posts/${encodeURIComponent(postId)}`,
    { signal, timeout: 15000 },
  )
  return data
}

// 글을 가리거나(hidden=true) 다시 보이게 합니다. 바뀐 상세를 돌려받습니다.
export async function setPostHidden(postId, hidden, note) {
  const { data } = await api.patch(
    `/admin/community/posts/${encodeURIComponent(postId)}/visibility`,
    { hidden, note: note || null },
    { timeout: 15000 },
  )
  return data
}

// 댓글을 가리거나 다시 보이게 합니다. 댓글이 달린 글의 상세를 돌려받습니다.
export async function setCommentHidden(commentId, hidden, note) {
  const { data } = await api.patch(
    `/admin/community/comments/${encodeURIComponent(commentId)}/visibility`,
    { hidden, note: note || null },
    { timeout: 15000 },
  )
  return data
}
