import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, getKakaoLoginUrl } from '../api/authApi'
function LoginPage() {

    const handleKakaoLogin = async () => {
        try {
            const url = await getKakaoLoginUrl()
            window.location.href = url
        } catch (error) {
            console.error(error)
            alert('카카오 로그인을 시작하지 못했어.')
        }
    }

    const navigate = useNavigate()

    const [form, setForm] = useState({
        email: '',
        password: '',
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
            const result = await login(form)

            sessionStorage.setItem(
                'accessToken',
                result.accessToken
            )

            alert(`${result.name}님 로그인 성공!`)

            navigate('/')

        } catch (error) {

            console.error(error)

            alert('이메일 또는 비밀번호를 확인해줘.')
        }
    }

    return (
        <div>

            <h1>MOVRIT 로그인</h1>

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

                <button type="submit">
                    로그인
                </button>

            </form>

            <button onClick={() => navigate('/signup')}>
                회원가입
            </button>

            <hr />

            <button
                type="button"
                onClick={handleKakaoLogin}
            >
                카카오로 로그인
            </button>

            <button>
                Google로 로그인
            </button>

        </div>
    )
}

export default LoginPage
