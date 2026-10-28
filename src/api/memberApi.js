/**
 * 회원가입 폼을 서버에 전달하고 생성 결과 본문을 반환합니다.
 * 화면에서 선택한 이용 목적에 따라 업체나 운영자 권한을 임의로 부여하지 않습니다.
 */
import api from './axios'

export const signup = async (data) => {
  const response = await api.post('/members/signup', data)
  if (typeof response.data?.nickname !== 'string') {
    throw new Error('회원 닉네임 저장 응답을 확인하지 못했습니다.')
  }
  return response.data
}

// 본인 정보는 서버에서 읽으며 이메일·권한을 수정 요청에 포함하지 않습니다.
export const getMyMemberProfile = async () =>
  (await api.get('/members/me')).data
export const updateMyMemberProfile = async (data) => {
  const response = (await api.put('/members/me', data)).data
  // 구버전 또는 불완전 응답을 닉네임 저장 성공으로 표시하지 않습니다.
  if (typeof response?.nickname !== 'string') {
    throw new Error('닉네임 저장 응답을 확인하지 못했습니다.')
  }
  return response
}
