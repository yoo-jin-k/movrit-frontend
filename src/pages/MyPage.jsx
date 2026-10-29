/**
 * 로그인 회원 정보를 읽어 개인 메뉴를 표시하고 로그아웃을 처리합니다.
 * 서버 로그아웃 호출과 별도로 브라우저 토큰을 정리한 뒤 로그인 경로로 이동합니다.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MemberAvatar from '../features/membership/MemberAvatar'
import '../features/membership/accountProfile.css'
import LogoutButton from '../features/auth/LogoutButton'
import { getMyInfo } from '../api/authApi'
import BuyerLayout, { BuyerCard } from '../components/buyer/BuyerLayout'

const links = [
  ['계정 설정', '닉네임·비밀번호·배송지 관리', '/settings'],
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
    const refresh = () =>
      getMyInfo()
        .then(setMember)
        .catch(() => {
          navigate('/login')
        })
    refresh()
    window.addEventListener('movrit:profile-updated', refresh)
    return () => window.removeEventListener('movrit:profile-updated', refresh)
  }, [navigate])
  if (!member)
    return (
      <BuyerLayout title="마이페이지">
        <p>회원 정보를 불러오는 중...</p>
      </BuyerLayout>
    )
  return (
    <BuyerLayout title="마이페이지">
      <BuyerCard className="buyer-my-profile">
        <MemberAvatar member={member} size={64} />
        <div>
          <h2>{member.nickname || '내 계정'}</h2>
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
        <LogoutButton className="buyer-v2-button buyer-v2-button--secondary" />
        {member.role === 'ADMIN' && (
          <Link to="/admin/dashboard">관리자 콘솔</Link>
        )}
      </div>
    </BuyerLayout>
  )
}
