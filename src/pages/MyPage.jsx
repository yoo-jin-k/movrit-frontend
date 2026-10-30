/**
 * 로그인 회원 정보를 읽어 나의 캠페인 요약과 개인 메뉴를 표시하고 로그아웃을 처리합니다.
 * 서버 로그아웃 호출과 별도로 브라우저 토큰을 정리한 뒤 로그인 경로로 이동합니다.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MemberAvatar from '../features/membership/MemberAvatar'
import MyCampaignSummary from '../features/membership/MyCampaignSummary'
import '../features/membership/accountProfile.css'
import LogoutButton from '../features/auth/LogoutButton'
import { getMyInfo } from '../api/authApi'
import BuyerLayout, { BuyerCard } from '../components/buyer/BuyerLayout'

// 캠페인 활동 메뉴를 먼저 보여주고, 기존 프리오더·주문 메뉴는 별도 묶음으로 유지합니다.
// 경로는 기존 화면을 그대로 사용하며 설명 문구만 각 메뉴의 실제 용도로 구체화했습니다.
const campaignLinks = [
  ['내 캠페인', '신청·선정·콘텐츠 제출 진행 확인', '/mypage/campaigns'],
  ['찜한 캠페인', '관심 있는 캠페인 모아 보기', '/favorites'],
  ['등록 콘텐츠', '제출한 게시물 링크와 검토 결과', '/mypage/contents'],
  ['활동 프로필', '캠페인 참여에 사용할 채널 정보 관리', '/creator/profile'],
  ['알림', '선정·검토 결과 등 받은 알림 확인', '/notifications'],
]
const accountLinks = [
  ['계정 설정', '사진·닉네임·비밀번호 관리', '/settings'],
  ['배송지 관리', '체험 상품을 받을 주소록', '/mypage/addresses'],
  ['알림 설정', '받을 알림 종류 선택', '/mypage/notifications'],
  ['문의/고객센터', '1:1 문의 내역 확인', '/inquiries'],
]
const shoppingLinks = [
  ['주문 내역', '프리오더 주문·배송 확인', '/orders'],
  ['찜한 프리오더', '관심 등록한 프리오더 모음', '/favorites/preorders'],
  ['결제수단 관리', '등록한 결제수단 확인', '/mypage/payments'],
]

// 메뉴 묶음 하나를 제목과 카드 목록으로 렌더링합니다.
function MenuGroup({ title, links }) {
  return (
    <section className="buyer-my-group" aria-label={title}>
      <h2>{title}</h2>
      <div className="buyer-my-menu">
        {links.map(([label, note, to]) => (
          <Link key={to} to={to}>
            <strong>{label}</strong>
            <small>{note}</small>
            <i aria-hidden="true">›</i>
          </Link>
        ))}
      </div>
    </section>
  )
}
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
      <MyCampaignSummary />
      <MenuGroup title="캠페인 활동" links={campaignLinks} />
      <MenuGroup title="계정" links={accountLinks} />
      <MenuGroup title="프리오더 쇼핑" links={shoppingLinks} />
      <div className="buyer-my-actions">
        <LogoutButton className="buyer-v2-button buyer-v2-button--secondary" />
        {member.role === 'ADMIN' && (
          <Link to="/admin/dashboard">관리자 콘솔</Link>
        )}
      </div>
    </BuyerLayout>
  )
}
