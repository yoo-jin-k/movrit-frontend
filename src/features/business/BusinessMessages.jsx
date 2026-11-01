/**
 * 업체 메시지 화면입니다(/seller/messages).
 * 캠페인 참여자와의 대화(신청별)와 운영자 1:1 문의를 봅니다. 참여자 상세의 '참여자와 채팅하기'로 대화를 시작합니다.
 */
import ChatInbox from '../chat/ChatInbox'
import { PageHeader } from './BusinessUi'

export default function BusinessMessages() {
  return (
    <>
      <PageHeader
        title="메시지"
        description="참여자와 캠페인 진행을 이야기하고, 운영자에게 문의할 수 있습니다."
      />
      <ChatInbox emptyHint="참여자 상세의 '참여자와 채팅하기'로 대화를 시작할 수 있습니다." />
    </>
  )
}
