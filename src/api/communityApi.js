/**
 * 커뮤니티 게시판 API입니다. 목록·상세는 로그인 없이 볼 수 있고(로그인 상태면 내 글·댓글이 표시됨),
 * 글·댓글 쓰기·고치기·지우기는 로그인이 필요합니다.
 */
import api from './axios'

export async function readCommunityPosts(
  { board, category, q, page = 0 },
  signal,
) {
  const { data } = await api.get('/community/posts', {
    params: {
      board,
      category: category && category !== '전체' ? category : undefined,
      q: q || undefined,
      page,
    },
    signal,
    timeout: 15000,
  })
  return data
}

export async function readCommunityPost(id, signal) {
  const { data } = await api.get(`/community/posts/${encodeURIComponent(id)}`, {
    signal,
    timeout: 15000,
  })
  return data
}

export async function createCommunityPost(payload) {
  const { data } = await api.post('/community/posts', payload, {
    timeout: 15000,
  })
  return data
}

export async function updateCommunityPost(id, payload) {
  const { data } = await api.put(
    `/community/posts/${encodeURIComponent(id)}`,
    payload,
    { timeout: 15000 },
  )
  return data
}

export async function deleteCommunityPost(id) {
  await api.delete(`/community/posts/${encodeURIComponent(id)}`, {
    timeout: 15000,
  })
}

export async function addCommunityComment(postId, body) {
  const { data } = await api.post(
    `/community/posts/${encodeURIComponent(postId)}/comments`,
    { body },
    { timeout: 15000 },
  )
  return data
}

export async function deleteCommunityComment(id) {
  await api.delete(`/community/comments/${encodeURIComponent(id)}`, {
    timeout: 15000,
  })
}
