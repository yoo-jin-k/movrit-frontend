import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, getKakaoLoginUrl, getGoogleLoginUrl } from '../api/authApi'
import CommonLayout from '../components/layout/CommonLayout'

function LoginPage() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })

    const handleKakaoLogin = async () => {
        try {
            const url = await getKakaoLoginUrl()
            window.location.href = url
        } catch (error) {
            console.error(error)
            alert('카카오 로그인을 시작하지 못했어.')
        }
    }

    const handleGoogleLogin = async () => {
        try {
            const url = await getGoogleLoginUrl()
            window.location.href = url
        } catch (error) {
            console.error(error)
            alert('구글 로그인을 시작하지 못했어.')
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm({ ...form, [name]: value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const result = await login(form)
            sessionStorage.setItem('accessToken', result.accessToken)
            localStorage.setItem('refreshToken', result.refreshToken)
            alert(`${result.name}님 로그인 성공!`)
            navigate('/mypage')
        } catch (error) {
            console.error(error)
            alert('이메일 또는 비밀번호를 확인해줘.')
        }
    }

    return (
        <CommonLayout title="로그인" className="common-auth-page">
            <form className="common-card common-auth-card" onSubmit={handleSubmit}>
                <h2>MOVRIT에 로그인</h2>
                <p>프리오더와 협업을 한 곳에서 관리해.</p>
                <label className="common-field">이메일
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                        placeholder="name@example.com"
                    /></label>
                <label className="common-field">비밀번호
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        autoComplete="current-password"
                    /></label>
                <button className="common-button" type="submit">로그인</button>
                <button className="common-auth-card__forgot" type="button" onClick={() => navigate('/password/forgot')}>
                비밀번호를 잊었어?
                </button>
                <hr />
                <button className="common-button" type="button" onClick={handleGoogleLogin}>Google로 계속</button>
                <button className="common-button" type="button" onClick={handleKakaoLogin}>Kakao로 계속</button>
                <button className="common-auth-card__signup" type="button" onClick={() => navigate('/signup')}>회원가입</button>
            </form>
        </CommonLayout>
    )
}

export default LoginPage
