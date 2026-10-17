import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyInfo, logout } from '../api/authApi'
import BuyerLayout, {
  BuyerButton,
  BuyerCard,
} from '../components/buyer/BuyerLayout'

const links = [
  ['내 캠페인 신청', '신청 및 진행 상태 확인', '/mypage/campaigns'],
  ['활동 프로필', '캠페인 참여에 사용할 프로필 관리', '/creator/profile'],
  ['주문 내역', '설정 및 상세 보기', '/orders'],
  ['찜한 프리오더', '설정 및 상세 보기', '/favorites'],
  ['배송지 관리', '설정 및 상세 보기', '/mypage/addresses'],
  ['결제수단 관리', '설정 및 상세 보기', '/mypage/payments'],
  ['알림 설정', '설정 및 상세 보기', '/mypage/notifications'],
  ['문의/고객센터', '설정 및 상세 보기', '/inquiries'],
]
export default function MyPage() {
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  useEffect(() => {
    getMyInfo()
      .then(setMember)
      .catch(() => {
        navigate('/login')
      })
  }, [navigate])
  const signout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error(error)
    }
    sessionStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    navigate('/login')
  }
  if (!member)
    return (
      <BuyerLayout title="마이페이지">
        <p>회원 정보를 불러오는 중...</p>
      </BuyerLayout>
    )
  return (
    <BuyerLayout title="마이페이지">
      <BuyerCard className="buyer-my-profile">
        <span>{member.name?.slice(0, 1)}</span>
        <div>
          <h2>{member.name}</h2>
          <p>{member.email}</p>
        </div>
        <Link
          className="buyer-v2-button buyer-v2-button--secondary"
          to="/mypage/profile"
        >
          프로필 수정
        </Link>
      </BuyerCard>
      <div className="buyer-my-menu">
        {links.map(([title, note, to]) => (
          <Link key={to} to={to}>
            <strong>{title}</strong>
            <small>{note}</small>
            <i>›</i>
          </Link>
        ))}
      </div>
      <div className="buyer-my-actions">
        <BuyerButton onClick={signout}>로그아웃</BuyerButton>
        {member.role === 'ADMIN' && (
          <Link to="/admin/dashboard">관리자 콘솔</Link>
        )}
      </div>
    </BuyerLayout>
  )
}
