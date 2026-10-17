// 접근 차단이나 통신 장애를 잘못된 비밀번호로 단정하지 않습니다.
export function loginError(error) {
  const status = error.response?.status
  if (!status)
    return '로그인 서버에 연결하지 못했습니다. 연결 상태와 접속 주소를 확인해 주세요.'
  if (status === 403)
    return '로그인 요청이 차단되었습니다. 접속 주소 또는 접근 권한을 확인해 주세요.'
  if (status === 401) return '이메일 또는 비밀번호를 확인해 주세요.'
  if (status === 429)
    return '로그인 요청이 많습니다. 잠시 후 다시 시도해 주세요.'
  if (status >= 500)
    return '로그인 서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  return '로그인 요청을 처리하지 못했습니다. 입력 내용을 확인해 주세요.'
}
