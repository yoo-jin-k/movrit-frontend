import { useEffect, useState } from 'react'
import { getMyInfo } from '../api/authApi'
import { useNavigate } from 'react-router-dom'

function MyPage() {
    const navigate = useNavigate()
    const [myInfo, setMyInfo] = useState(null)

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

    if (!myInfo) {
        return <p>회원 정보를 불러오는 중...</p>
    }

    return (
        <div>
            <h1>마이페이지</h1>

            <p>{myInfo.name}님</p>
            <p>회원 ID: {myInfo.id}</p>
            <p>권한: {myInfo.role}</p>

            <button onClick={() => navigate('/seller/apply')}>
                판매자 등록 / 신청 상태
            </button>

            {myInfo.role === 'ADMIN' && (
                <button onClick={() => navigate('/admin/sellers')}>
                    판매자 신청 심사
                </button>
            )}

            <button onClick={handleLogout}>
                로그아웃
            </button>
        </div>
    )
}

export default MyPage
