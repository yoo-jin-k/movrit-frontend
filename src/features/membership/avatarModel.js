/** 서버가 발급한 회원 사진 경로만 표시하고 누락값을 기본 아바타로 처리합니다. */
export function avatarUrl(value) {
  return typeof value === 'string' &&
    /^\/api\/members\/\d+\/avatar\?v=[A-Za-z0-9_-]+$/.test(value)
    ? value
    : null
}
export function avatarFileError(file) {
  if (!file) return '사진을 선택해 주세요.'
  if (!['image/jpeg', 'image/png'].includes(file.type))
    return 'JPEG 또는 PNG 사진을 선택해 주세요.'
  if (!file.size || file.size > 5 * 1024 * 1024)
    return '사진은 5MiB 이하로 선택해 주세요.'
  return ''
}
