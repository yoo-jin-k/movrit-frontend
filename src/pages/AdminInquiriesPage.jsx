import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { answerInquiry, getAdminInquiries } from '../api/inquiryApi'

function AdminInquiriesPage() {
    const navigate = useNavigate()
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
        <div>
            <h1>관리자 문의 관리</h1>
            <button onClick={() => navigate('/admin/dashboard')}>관리자 대시보드</button>
            <button onClick={() => navigate('/mypage')}>마이페이지</button>

            <label>
                상태
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">전체</option>
                    <option value="OPEN">답변 대기</option>
                    <option value="ANSWERED">답변 완료</option>
                    <option value="CLOSED">종료</option>
                </select>
            </label>

            {items.length === 0 && <p>해당 문의가 없어.</p>}

            {items.map((item) => (
                <article key={item.id} style={{ border: '1px solid #ddd', padding: 12, marginTop: 12 }}>
                    <strong>#{item.id} [{item.category}] {item.title}</strong>
                    <p>회원: {item.memberName} (#{item.memberId})</p>
                    <p>상태: {item.status}</p>
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
                                onChange={(e) => setAnswers({ ...answers, [item.id]: e.target.value })}
                                placeholder="답변 내용을 입력해줘."
                                maxLength={5000}
                            />
                            <button onClick={() => submitAnswer(item.id)}>
                                {item.answer ? '답변 수정' : '답변 등록'}
                            </button>
                        </div>
                    )}
                </article>
            ))}
        </div>
    )
}

export default AdminInquiriesPage
