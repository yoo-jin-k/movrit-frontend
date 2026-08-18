import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signup } from '../api/memberApi'

function SignupPage() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        email: '',
        password: '',
        name: '',
        phone: '',
    })

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

            alert('회원가입이 완료됐어. 로그인해줘.')

            // 회원가입은 인증 토큰을 발급하지 않으므로 로그인 화면으로 이동시킨다.
            navigate('/login', { replace: true })
        } catch (error) {
            console.error('회원가입 실패:', error)
            alert('회원가입에 실패했어.')
        }
    }

    return (
        <div>
            <h1>MOVRIT 회원가입</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>이메일</label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>비밀번호</label>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>이름</label>
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>휴대폰번호</label>
                    <input
                        type="text"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                    />
                </div>

                <button type="submit">
                    회원가입
                </button>
            </form>
        </div>
    )
}

export default SignupPage
