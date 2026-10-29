/** 계정 설정은 기존 닉네임 수정과 보안·주소 관리 경로를 한곳에서 제공합니다. */
import { Link } from 'react-router-dom'
import BuyerLayout from '../../components/buyer/BuyerLayout'
import LogoutButton from '../auth/LogoutButton'
export default function AccountSettingsPage() {
  return (
    <BuyerLayout title="계정 설정">
      <p>회원 정보와 로그인 비밀번호, 배송지를 관리하세요.</p>
      <div className="buyer-my-menu">
        <Link to="/mypage/profile">
          <strong>닉네임 변경</strong>
          <small>메뉴와 서비스에 표시되는 회원 닉네임을 수정합니다.</small>
          <i>›</i>
        </Link>
        <Link to="/settings/security">
          <strong>비밀번호 변경</strong>
          <small>현재 비밀번호를 확인하고 새 비밀번호로 변경합니다.</small>
          <i>›</i>
        </Link>
        <Link to="/mypage/addresses">
          <strong>배송지 관리</strong>
          <small>배송지를 추가·수정하고 기본 배송지를 관리합니다.</small>
          <i>›</i>
        </Link>
      </div>
      <p>주소록을 변경해도 이미 신청한 캠페인의 배송 정보는 바뀌지 않습니다.</p>
      <LogoutButton className="buyer-v2-button buyer-v2-button--secondary" />
    </BuyerLayout>
  )
}
