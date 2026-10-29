/** 사진 파일은 multipart로 전송하며 저장 응답의 버전 URL만 사용합니다. */
import api from './axios'
import { avatarUrl } from '../features/membership/avatarModel'
export async function uploadMemberAvatar(file) {
  const body = new FormData()
  body.append('file', file)
  const { data } = await api.put('/members/me/avatar', body, {
    headers: { 'Content-Type': undefined },
    timeout: 30000,
  })
  if (!avatarUrl(data?.avatarUrl))
    throw new Error('사진 저장 응답을 확인하지 못했습니다.')
  return data
}
export async function deleteMemberAvatar() {
  const response = await api.delete('/members/me/avatar', { timeout: 15000 })
  if (response.status !== 204)
    throw new Error('사진 삭제 응답을 확인하지 못했습니다.')
}
