import { useState } from 'react'
import { signup } from '../api/memberApi'

function SignupPage() {
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
            const result = await signup(form)

            console.log('회원가입 성공:', result)

            alert('회원가입 성공!')
        } catch (error) {
            console.error('회원가입 실패:', error)

            alert('회원가입 실패')
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
