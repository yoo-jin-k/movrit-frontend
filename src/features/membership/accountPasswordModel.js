/** 서버와 같은 글자 수·UTF-8 길이를 확인하며 입력 내용은 로그에 남기지 않습니다. */
export function passwordValidation({ currentPassword, newPassword, confirm }) {
  if (
    !currentPassword ||
    newPassword.length < 8 ||
    newPassword.length > 100 ||
    !/[A-Za-z]/.test(newPassword) ||
    !/[0-9]/.test(newPassword)
  )
    return '새 비밀번호는 영문과 숫자를 포함하여 8~100자로 입력해 주세요.'
  if (new TextEncoder().encode(newPassword).length > 72)
    return '새 비밀번호는 UTF-8 기준 72바이트 이내로 입력해 주세요. 한글 등은 한 글자가 여러 바이트입니다.'
  if (newPassword !== confirm) return '새 비밀번호 확인이 일치하지 않습니다.'
  if (currentPassword === newPassword)
    return '현재 비밀번호와 다른 비밀번호를 입력해 주세요.'
  return ''
}
export function passwordError(cause) {
  const reason = cause.response?.data?.detail
  return (
    {
      CURRENT_PASSWORD_MISMATCH: '현재 비밀번호가 올바르지 않습니다.',
      PASSWORD_REUSE: '현재 비밀번호와 다른 비밀번호를 입력해 주세요.',
      PASSWORD_NOT_CONFIGURED:
        '비밀번호가 없는 계정입니다. 연결된 소셜 로그인 수단을 이용해 주세요.',
      PASSWORD_TOO_LONG_IN_BYTES:
        '새 비밀번호는 UTF-8 기준 72바이트 이내로 입력해 주세요.',
    }[reason] ||
    (cause.response?.status === 401
      ? '로그인 상태를 확인한 뒤 다시 로그인해 주세요.'
      : cause.response?.status === 400
        ? '비밀번호 입력 형식을 확인해 주세요.'
        : '변경 결과를 확인하지 못했습니다. 다시 시도하기 전에 로그인 상태를 확인해 주세요.')
  )
}
