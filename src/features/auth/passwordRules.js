/** 새 비밀번호 규칙입니다(서버와 같음: 영문·숫자 포함 8~100자). 문제가 없으면 빈 문자열을 돌려줍니다. */
export function newPasswordError(password, confirm) {
  const value = String(password || '')
  if (value.length < 8 || value.length > 100)
    return '비밀번호는 8자 이상 100자 이하로 입력해 주세요.'
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value))
    return '비밀번호에는 영문자와 숫자를 각각 하나 이상 포함해 주세요.'
  if (value !== confirm) return '비밀번호 확인이 일치하지 않습니다.'
  return ''
}
