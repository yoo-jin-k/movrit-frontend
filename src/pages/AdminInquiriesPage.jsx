/**
 * 상태별 운영 문의를 조회하고 문의 ID별로 입력한 답변을 전송합니다.
 * 빈 답변을 막고 등록 후 목록을 다시 읽으며 실패 시 입력 내용을 성공 처리하지 않습니다.
 */
import { useEffect, useState } from 'react'
import { answerInquiry, getAdminInquiries } from '../api/inquiryApi'
import AdminLayout, {
  AdminButton,
  AdminCard,
  AdminStatus,
} from '../components/admin/AdminLayout'

function AdminInquiriesPage() {
  const [status, setStatus] = useState('OPEN')
  const [items, setItems] = useState([])
  const [answers, setAnswers] = useState({})

  const load = async () => {
    setItems(await getAdminInquiries(status || null))
  }

  useEffect(() => {
    getAdminInquiries(status || null)
      .then(setItems)
      .catch((error) => {
        console.error(error)
        alert('문의 목록을 불러오지 못했어.')
      })
  }, [status])

  // 문의 ID별 답변을 공백 제거 후 검증합니다. 저장 성공 시 그 답변 입력만 지우고 현재 필터 목록을 재조회합니다.
  const submitAnswer = async (id) => {
    const answer = answers[id]?.trim()
    if (!answer) {
      alert('답변 내용을 입력해줘.')
      return
    }
    try {
      await answerInquiry(id, answer)
      setAnswers((current) => ({ ...current, [id]: '' }))
      await load()
      alert('답변을 등록했어.')
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || '답변을 등록하지 못했어.')
    }
  }

  return (
    <AdminLayout title="신고 / 문의 관리">
      <div className="admin-filters">
        <label>
          <span className="sr-only">상태</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">전체</option>
            <option value="OPEN">답변 대기</option>
            <option value="ANSWERED">답변 완료</option>
            <option value="CLOSED">종료</option>
          </select>
        </label>
      </div>

      {items.length === 0 && (
        <AdminCard title="신고 / 문의 목록">
          <p className="admin-muted">해당 문의가 없습니다.</p>
        </AdminCard>
      )}

      {items.map((item) => (
        <AdminCard key={item.id} className="admin-inquiry">
          <div className="admin-inquiry__head">
            <strong>
              #{item.id} [{item.category}] {item.title}
            </strong>
            <AdminStatus
              tone={item.status === 'ANSWERED' ? 'success' : 'warning'}
            >
              {item.status}
            </AdminStatus>
          </div>
          <p>
            회원: {item.memberName} (#{item.memberId})
          </p>
          {item.preorderTitle && <p>프리오더: {item.preorderTitle}</p>}
          <p>{item.content}</p>

          {item.answer && (
            <div>
              <strong>기존 답변</strong>
              <p>{item.answer}</p>
            </div>
          )}

          {item.status !== 'CLOSED' && (
            <div>
              <textarea
                value={answers[item.id] || ''}
                onChange={(e) =>
                  setAnswers({ ...answers, [item.id]: e.target.value })
                }
                placeholder="답변 내용을 입력해줘."
                maxLength={5000}
              />
              <AdminButton tone="primary" onClick={() => submitAnswer(item.id)}>
                {item.answer ? '답변 수정' : '답변 등록'}
              </AdminButton>
            </div>
          )}
        </AdminCard>
      ))}
    </AdminLayout>
  )
}

export default AdminInquiriesPage
