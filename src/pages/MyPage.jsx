import { useEffect, useState } from 'react'
import { getMyInfo } from '../api/authApi'
import { useNavigate } from 'react-router-dom'

function MyPage() {
    const navigate = useNavigate()
    const [myInfo, setMyInfo] = useState('')

    useEffect(() => {
        const loadMyInfo = async () => {
            try {
                const result = await getMyInfo()
                setMyInfo(result)
            } catch (error) {
                console.error(error)

                sessionStorage.removeItem('accessToken')
                alert('로그인이 필요해.')
                navigate('/login')
            }
        }

        loadMyInfo()
    }, [navigate])

    const handleLogout = () => {
        sessionStorage.removeItem('accessToken')
        navigate('/login')
    }

    return (
        <div>
            <h1>마이페이지</h1>

            <p>{myInfo}</p>

            <button onClick={handleLogout}>
                로그아웃
            </button>
        </div>
    )
}

export default MyPage
