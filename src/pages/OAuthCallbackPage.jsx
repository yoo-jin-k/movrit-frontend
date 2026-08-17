import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

function OAuthCallbackPage() {

    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const token = searchParams.get('token')

    useEffect(() => {

        if (!token) {
            alert('간편로그인에 실패했어.')
            navigate('/login', { replace: true })
            return
        }

        sessionStorage.setItem(
            'accessToken',
            token
        )

        navigate('/mypage', {
            replace: true
        })

    }, [token, navigate])

    return (
        <div>
            로그인 처리 중...
        </div>
    )
}

export default OAuthCallbackPage
