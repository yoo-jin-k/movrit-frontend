/** 서버 대상 유형과 식별자만 경로로 변환하며 임의 URL은 사용하지 않습니다. */
export function notificationPath(item, business = false) {
  const id = Number(item.targetId)
  if (!Number.isSafeInteger(id) || id <= 0) return null
  const paths = business
    ? {
        CAMPAIGN_APPLICATION: `/seller/participants?applicationId=${id}`,
        CAMPAIGN_CONTENT: `/seller/contents?contentId=${id}`,
        INQUIRY: '/seller/inbox?tab=inquiries',
        PREORDER: `/preorders/${id}`,
      }
    : {
        CAMPAIGN_APPLICATION: `/mypage/campaigns?applicationId=${id}`,
        CAMPAIGN_CONTENT: `/mypage/campaigns?contentId=${id}`,
        INQUIRY: '/inquiries',
        PREORDER: `/preorders/${id}`,
        // 채널 확인 결과(확인·반려)는 설정의 SNS 채널 연결 영역으로 이동합니다.
        MEMBER_CHANNEL_CONNECTION: '/settings#channel-connect',
      }
  return paths[item.targetType] || null
}
export function filterNotifications(items, filter) {
  if (filter === 'unread') return items.filter((item) => !item.read)
  if (filter === 'campaign')
    return items.filter((item) =>
      ['CAMPAIGN_APPLICATION', 'CAMPAIGN_CONTENT'].includes(item.targetType),
    )
  return filter ? items.filter((item) => item.targetType === filter) : items
}
