import { useEffect, useState } from 'react'
import { closeInquiry, createInquiry, getMyInquiries } from '../api/inquiryApi'
import CommonLayout from '../components/layout/CommonLayout'

function InquiriesPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({
    preorderId: '',
    category: 'GENERAL',
    title: '',
    content: '',
  })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setItems(await getMyInquiries())
  }

  useEffect(() => {
    getMyInquiries()
      .then(setItems)
      .catch((error) => {
        console.error(error)
        alert('문의 내역을 불러오지 못했어.')
      })
      .finally(() => setLoading(false))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await createInquiry({
        preorderId: form.preorderId ? Number(form.preorderId) : null,
        category: form.category,
        title: form.title,
        content: form.content,
      })
      setForm({ preorderId: '', category: 'GENERAL', title: '', content: '' })
      await load()
      alert('문의를 등록했어.')
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || '문의를 등록하지 못했어.')
    }
  }

  const close = async (id) => {
    try {
      const updated = await closeInquiry(id)
      setItems((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      )
    } catch (error) {
      console.error(error)
      alert('문의를 종료하지 못했어.')
    }
  }

  return (
    <CommonLayout title="고객센터">
      <div className="support-layout">
        <section className="support-categories">
          {['주문/결제', '프리오더', '협업/계약', '정산', '계정', '기타'].map(
            (category) => (
              <article key={category}>
                <strong>{category}</strong>
                <small>자주 묻는 질문</small>
              </article>
            ),
          )}
        </section>
        <form className="common-card support-form" onSubmit={submit}>
          <h2>1:1 문의하기</h2>
          <label className="common-field">
            문의 유형
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="GENERAL">일반</option>
              <option value="ORDER">주문</option>
              <option value="PAYMENT">결제</option>
              <option value="REFUND">취소/환불</option>
              <option value="SHIPPING">배송</option>
              <option value="PREORDER">프리오더</option>
            </select>
          </label>
          <label className="common-field">
            관련 프리오더 ID (선택)
            <input
              type="number"
              min="1"
              value={form.preorderId}
              onChange={(e) => setForm({ ...form, preorderId: e.target.value })}
            />
          </label>
          <label className="common-field">
            제목
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={200}
              required
            />
          </label>
          <label className="common-field">
            내용
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              maxLength={5000}
              required
            />
          </label>
          <button className="common-button" type="submit">
            문의 접수
          </button>
        </form>
      </div>
      <section className="inquiry-history">
        <h2>내 문의 내역</h2>
        {loading && <p>불러오는 중...</p>}
        {!loading && items.length === 0 && <p>등록한 문의가 없어.</p>}

        {items.map((item) => (
          <article key={item.id}>
            <strong>
              [{item.category}] {item.title}
            </strong>
            <p>상태: {item.status}</p>
            {item.preorderTitle && <p>관련 프리오더: {item.preorderTitle}</p>}
            <p>{item.content}</p>
            {item.answer && (
              <div>
                <strong>답변</strong>
                <p>{item.answer}</p>
              </div>
            )}
            {item.status !== 'CLOSED' && (
              <button onClick={() => close(item.id)}>문의 종료</button>
            )}
          </article>
        ))}
      </section>
    </CommonLayout>
  )
}

export default InquiriesPage
