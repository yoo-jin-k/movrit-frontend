/**
 * 운영자 메시지 화면입니다(/admin/messages).
 * 회원의 운영자 문의와 모든 캠페인 대화(참여자 ↔ 브랜드)를 보고, 필요하면 대화에 참여합니다. 처음 연 방에는 운영자로 추가됩니다.
 */
import AdminLayout from '../components/admin/AdminLayout'
import ChatInbox from '../features/chat/ChatInbox'

export default function AdminMessagesPage() {
  return (
    <AdminLayout title="메시지">
      <p>
        회원의 운영자 문의에 답하고, 참여자와 브랜드의 캠페인 대화를 확인할 수
        있습니다. 운영자가 보낸 메시지는 노란 말풍선으로 표시됩니다.
      </p>
      <ChatInbox
        allowSupport={false}
        emptyHint="아직 시작된 대화가 없습니다."
      />
    </AdminLayout>
  )
}
