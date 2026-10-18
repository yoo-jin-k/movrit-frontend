/**
 * 회원가입 폼을 서버에 전달하고 생성 결과 본문을 반환합니다.
 * 화면에서 선택한 이용 목적에 따라 업체나 운영자 권한을 임의로 부여하지 않습니다.
 */
import api from './axios'

export const signup = async (data) => {
  const response = await api.post('/members/signup', data)
  return response.data
}
