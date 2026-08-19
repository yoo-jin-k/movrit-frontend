import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { closeInquiry, createInquiry, getMyInquiries } from '../api/inquiryApi'

function InquiriesPage() {
    const navigate = useNavigate()
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
            setItems((current) => current.map((item) => item.id === id ? updated : item))
        } catch (error) {
            console.error(error)
            alert('문의를 종료하지 못했어.')
        }
    }

    return (
        <div>
            <h1>1:1 문의</h1>
            <button onClick={() => navigate('/mypage')}>마이페이지</button>

            <h2>문의 등록</h2>
            <form onSubmit={submit}>
                <label>
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
                <label>
                    관련 프리오더 ID (선택)
                    <input
                        type="number"
                        min="1"
                        value={form.preorderId}
                        onChange={(e) => setForm({ ...form, preorderId: e.target.value })}
                    />
                </label>
                <label>
                    제목
                    <input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        maxLength={200}
                        required
                    />
                </label>
                <label>
                    내용
                    <textarea
                        value={form.content}
                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                        maxLength={5000}
                        required
                    />
                </label>
                <button type="submit">문의 등록</button>
            </form>

            <hr />
            <h2>내 문의 내역</h2>
            {loading && <p>불러오는 중...</p>}
            {!loading && items.length === 0 && <p>등록한 문의가 없어.</p>}

            {items.map((item) => (
                <article key={item.id} style={{ border: '1px solid #ddd', padding: 12, marginTop: 12 }}>
                    <strong>[{item.category}] {item.title}</strong>
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
        </div>
    )
}

export default InquiriesPage
