/** 서버 대상 유형과 식별자만 경로로 변환하며 임의 URL은 사용하지 않습니다. */
export function notificationPath(item, business = false) {
  const id = Number(item.targetId)
  if (!Number.isSafeInteger(id) || id <= 0) return null
  const paths = business
    ? {
        CAMPAIGN_APPLICATION: `/seller/participants?applicationId=${id}`,
        CAMPAIGN_CONTENT: `/seller/contents?contentId=${id}`,
        // 운영자가 캠페인을 숨기거나 다시 공개하면 해당 캠페인 편집 화면으로 이동합니다.
        CAMPAIGN: `/seller/campaigns/${id}`,
        // 새 채팅 메시지 알림은 해당 대화방으로 이동합니다.
        CHAT_ROOM: `/seller/messages?room=${id}`,
        INQUIRY: '/seller/inbox?tab=inquiries',
        PREORDER: `/preorders/${id}`,
      }
    : {
        CAMPAIGN_APPLICATION: `/mypage/campaigns?applicationId=${id}`,
        CAMPAIGN_CONTENT: `/mypage/campaigns?contentId=${id}`,
        INQUIRY: '/inquiries',
        PREORDER: `/preorders/${id}`,
        // 패널티 기록(미제출·노쇼·취소 누적) 알림은 활동 등급이 보이는 마이페이지로 이동합니다.
        CAMPAIGN_PENALTY: '/mypage',
        // 채널 확인 결과(확인·반려)는 설정의 SNS 채널 연결 영역으로 이동합니다.
        MEMBER_CHANNEL_CONNECTION: '/settings#channel-connect',
        CHAT_ROOM: `/messages?room=${id}`,
        // 운영자에게 온 새 신고 알림은 '신고·제재' 화면으로 이동합니다.
        ADMIN_REPORT: '/admin/moderation',
        // 운영자에게 온 협의 취소 요청 알림은 '패널티·마감 알림' 화면의 협의 취소 목록으로 이동합니다.
        ADMIN_CANCEL_REQUEST: '/admin/participation',
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
