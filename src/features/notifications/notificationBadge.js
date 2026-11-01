/** 종 아이콘 위에 보여줄 미확인 알림 배지 문구입니다. 0개면 배지를 그리지 않고, 99개를 넘으면 '99+'로 줄입니다. */
export function unreadBadgeText(count) {
  const value = Number(count) || 0
  if (value < 1) return ''
  return value > 99 ? '99+' : String(value)
}
