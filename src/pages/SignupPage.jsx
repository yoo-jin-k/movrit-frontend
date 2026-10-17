import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signup } from '../api/memberApi'
import CommonLayout from '../components/layout/CommonLayout'

function SignupPage() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        email: '',
        password: '',
        name: '',
        phone: '',
    })
    const [role, setRole] = useState('BUYER')

    const handleChange = (e) => {
        const { name, value } = e.target

        setForm({
            ...form,
            [name]: value,
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            await signup(form)

            alert('회원가입이 완료되었습니다. 로그인해주세요.')

            // 회원가입은 인증 토큰을 발급하지 않으므로 로그인 화면으로 이동시킨다.
            navigate('/login', { replace: true })
        } catch (error) {
            console.error('회원가입 실패:', error)
            alert('회원가입에 실패했습니다.')
        }
    }

    return (
        <CommonLayout title="회원가입">
            <h2 className="common-role-heading">어떻게 MOVRIT을 사용하실래요?</h2>
            <section className="common-role-grid">
                {[
                    ['BUYER', '구매자', '프리오더를 발견하고 참여하세요.', '주문 · 찜 · 알림'],
                    ['SELLER', '업체', '상품을 등록하고 크리에이터와 협업해 보세요.', '프리오더 · 주문 · 정산'],
                    ['CREATOR', '인플루언서', '브랜드 협업을 찾고 제안받아 보세요.', '협업 · 콘텐츠 · 성과'],
                ].map(([value, title, copy, meta]) => <article key={value} className={role === value ? 'is-selected' : ''}><h3>{title}</h3><p>{copy}</p><strong>{meta}</strong><button className="common-button" type="button" onClick={() => setRole(value)}>선택</button></article>)}
            </section>
            <aside className="common-role-note"><strong>역할은 나중에 추가할 수 있어요</strong><p>한 계정으로 구매자 + 업체/인플루언서 역할을 함께 사용할 수 있어요.</p><small>업체와 인플루언서 역할은 인증 심사 후 활성화돼요.</small></aside>
            <form className="common-card common-signup-form" onSubmit={handleSubmit}>
                <h2>가입 정보 입력</h2>
                <label className="common-field">이메일
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                    /></label>
                <label className="common-field">비밀번호
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                    /></label>
                <label className="common-field">이름
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                    /></label>
                <label className="common-field">휴대폰번호
                    <input
                        type="text"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                    /></label>
                <button className="common-button" type="submit">회원가입</button>
            </form>
        </CommonLayout>
    )
}

export default SignupPage
