import { useEffect, useState } from 'react'
import {
    getGoogleLinkUrl,
    getKakaoLinkUrl,
    getMyInfo,
    getSocialAccounts,
} from '../api/authApi'
import { useNavigate } from 'react-router-dom'

function MyPage() {
    const navigate = useNavigate()
    const [myInfo, setMyInfo] = useState(null)
    const [socialAccounts, setSocialAccounts] = useState([])

    useEffect(() => {
        const loadMyPage = async () => {
            try {
                const [member, accounts] = await Promise.all([
                    getMyInfo(),
                    getSocialAccounts(),
                ])

                setMyInfo(member)
                setSocialAccounts(accounts)
            } catch (error) {
                console.error(error)
                sessionStorage.removeItem('accessToken')
                alert('로그인이 필요해.')
                navigate('/login')
            }
        }

        loadMyPage()
    }, [navigate])

    const handleLogout = () => {
        sessionStorage.removeItem('accessToken')
        navigate('/login')
    }

    const isConnected = (provider) => {
        return socialAccounts.some((account) => account.provider === provider)
    }

    const handleSocialLink = async (provider) => {
        try {
            const url = provider === 'KAKAO'
                ? await getKakaoLinkUrl()
                : await getGoogleLinkUrl()

            window.location.href = url
        } catch (error) {
            console.error(error)
            alert('소셜 계정 연결을 시작하지 못했어.')
        }
    }

    if (!myInfo) {
        return <p>회원 정보를 불러오는 중...</p>
    }

    return (
        <div>
            <h1>마이페이지</h1>

            <p>{myInfo.name}님</p>
            <p>회원 ID: {myInfo.id}</p>
            <p>이메일: {myInfo.email || '등록된 이메일 없음'}</p>
            <p>권한: {myInfo.role}</p>

            <hr />

            <h2>소셜 계정 연결</h2>
            <p>
                연결해두면 같은 MOVRIT 회원 계정으로 카카오와 구글 로그인을 모두 사용할 수 있어.
            </p>

            <div>
                <span>카카오: {isConnected('KAKAO') ? '연결됨' : '연결 안 됨'}</span>
                {!isConnected('KAKAO') && (
                    <button onClick={() => handleSocialLink('KAKAO')}>
                        카카오 계정 연결
                    </button>
                )}
            </div>

            <div>
                <span>구글: {isConnected('GOOGLE') ? '연결됨' : '연결 안 됨'}</span>
                {!isConnected('GOOGLE') && (
                    <button onClick={() => handleSocialLink('GOOGLE')}>
                        구글 계정 연결
                    </button>
                )}
            </div>

            <hr />

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
