/**
 * 참여자 메시지 화면입니다(/messages).
 * 캠페인별 브랜드와의 대화와 운영자 1:1 문의를 한곳에서 봅니다.
 */
import BuyerLayout from '../components/buyer/BuyerLayout'
import ChatInbox from '../features/chat/ChatInbox'

export default function MessagesPage() {
  return (
    <BuyerLayout title="메시지">
      <ChatInbox emptyHint="내 캠페인 상세의 '브랜드와 채팅하기' 또는 '운영자에게 문의'로 대화를 시작할 수 있습니다." />
    </BuyerLayout>
  )
}
