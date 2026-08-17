import { useEffect, useState } from 'react'
import {
    getGoogleLinkUrl,
    getKakaoLinkUrl,
    getMyInfo,
    getSocialAccounts,
    logout,
} from '../api/authApi'
import { getMySellerProfile } from '../api/sellerApi'
import { useNavigate } from 'react-router-dom'

function MyPage() {
    const navigate = useNavigate()
    const [myInfo, setMyInfo] = useState(null)
    const [socialAccounts, setSocialAccounts] = useState([])
    const [seller, setSeller] = useState(null)

    useEffect(() => {
        const loadMyPage = async () => {
            try {
                const [member, accounts] = await Promise.all([
                    getMyInfo(),
                    getSocialAccounts(),
                ])

                setMyInfo(member)
                setSocialAccounts(accounts)

                try {
                    setSeller(await getMySellerProfile())
                } catch (error) {
                    if (error.response?.status !== 404) throw error
                }
            } catch (error) {
                console.error(error)
                sessionStorage.removeItem('accessToken')
                alert('로그인이 필요해.')
                navigate('/login')
            }
        }

        loadMyPage()
    }, [navigate])

    const handleLogout = async () => {
        try { await logout() } catch (error) { console.error(error) }
        sessionStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        navigate('/login')
    }

    const isConnected = (provider) => socialAccounts.some((account) => account.provider === provider)

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

    if (!myInfo) return <p>회원 정보를 불러오는 중...</p>

    return (
        <div>
            <h1>마이페이지</h1>

            <button onClick={() => navigate('/preorders')}>프리오더 둘러보기</button>
            <button onClick={() => navigate('/orders')}>내 주문 · 결제</button>
            <button onClick={() => navigate('/creator/profile')}>인플루언서 프로필</button>
            <button onClick={() => navigate('/creator/collaborations')}>인플루언서 협업</button>

            <p>{myInfo.name}님</p>
            <p>회원 ID: {myInfo.id}</p>
            <p>이메일: {myInfo.email || '등록된 이메일 없음'}</p>
            <p>권한: {myInfo.role}</p>

            <hr />

            <h2>소셜 계정 연결</h2>
            <p>연결해두면 같은 MOVRIT 회원 계정으로 카카오와 구글 로그인을 모두 사용할 수 있어.</p>

            <div>
                <span>카카오: {isConnected('KAKAO') ? '연결됨' : '연결 안 됨'}</span>
                {!isConnected('KAKAO') && (
                    <button onClick={() => handleSocialLink('KAKAO')}>카카오 계정 연결</button>
                )}
            </div>

            <div>
                <span>구글: {isConnected('GOOGLE') ? '연결됨' : '연결 안 됨'}</span>
                {!isConnected('GOOGLE') && (
                    <button onClick={() => handleSocialLink('GOOGLE')}>구글 계정 연결</button>
                )}
            </div>

            <hr />

            <h2>판매자 기능</h2>
            <button onClick={() => navigate('/seller/apply')}>
                판매자 등록 / 신청 상태
            </button>

            {seller?.status === 'APPROVED' && (
                <>
                    <p>판매자 승인 완료</p>
                    <button onClick={() => navigate('/seller/brands')}>내 브랜드 관리</button>
                    <button onClick={() => navigate('/seller/products')}>상품 · 재고 관리</button>
                    <button onClick={() => navigate('/seller/preorders')}>프리오더 관리</button>
                    <button onClick={() => navigate('/seller/operations')}>주문 · 배송 · 정산</button>
                    <button onClick={() => navigate('/seller/collaborations')}>인플루언서 협업 관리</button>
                </>
            )}

            {myInfo.role === 'ADMIN' && (
                <button onClick={() => navigate('/admin/sellers')}>
                    판매자 신청 심사
                </button>
            )}

            <hr />
            <button onClick={handleLogout}>로그아웃</button>
        </div>
    )
}

export default MyPage
