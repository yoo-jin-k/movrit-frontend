/**
 * 서버 상세 오류와 필드 오류를 우선 사용한 뒤 상태별 기본 안내로 보완합니다.
 * 통신 실패만으로 저장 여부나 인증 성공 여부를 단정하지 않습니다.
 */
// 업무 오류는 서버 안내를 우선 사용하고 통신 실패는 성공 여부를 단정하지 않습니다.
export function participationError(error, fallback) {
  const detail = error.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  const fields = error.response?.data?.fieldErrors
  if (fields && typeof fields === 'object') {
    const messages = Object.values(fields)
      .flat()
      .filter((value) => typeof value === 'string')
    if (messages.length) return messages.join(' ')
  }
  if (error.response?.status === 429)
    return '요청 횟수가 많습니다. 잠시 후 다시 시도해 주세요.'
  if (error.response?.status === 503)
    return '인증 메일 발송 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.'
  if (error.response?.status === 401)
    return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  return fallback
}
