/**
 * 사진과 기본 정보, 휴대폰 인증, 로그인 연결, 보안, 배송지를 명확한 그룹으로 구분합니다.
 * 소셜 계정 연결 콜백에서 돌아오면 location.state.linkNotice로 결과 안내를 받아 로그인 연결 영역에 표시합니다.
 */
import { Link, useLocation } from 'react-router-dom'
import BuyerLayout from '../../components/buyer/BuyerLayout'
import LogoutButton from '../auth/LogoutButton'
import useMemberAccount from './useMemberAccount'
import AvatarEditor from './AvatarEditor'
import SocialLoginLinks from './SocialLoginLinks'
import ChannelConnections from './ChannelConnections'
import PhoneVerification from './PhoneVerification'
import './accountProfile.css'
export default function AccountSettingsPage() {
  const state = useMemberAccount()
  const location = useLocation()
  return (
    <BuyerLayout title="내 정보 · 계정 설정" className="account-settings">
      <nav className="account-settings-nav" aria-label="계정 설정 항목">
        <a href="#profile-photo">프로필 사진</a>
        <a href="#account-basic">기본 정보</a>
        <a href="#phone-verify">휴대폰 인증</a>
        <a href="#social-login">로그인 연결</a>
        <a href="#channel-connect">SNS 채널 연결</a>
        <Link to="/settings/security">비밀번호</Link>
        <Link to="/mypage/addresses">배송지</Link>
      </nav>
      {state.error ? (
        <p role="alert">
          {state.error} <button onClick={state.reload}>다시 확인</button>
        </p>
      ) : state.loading ? (
        <p role="status">회원 정보를 확인하고 있습니다.</p>
      ) : null}
      <AvatarEditor member={state.member} onReload={state.reload} />
      <section id="account-basic" className="account-settings-group">
        <h2>기본 정보</h2>
        <dl>
          <div>
            <dt>닉네임</dt>
            <dd>{state.member?.nickname || '확인 필요'}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>{state.member?.email || '확인 필요'}</dd>
          </div>
        </dl>
        <Link to="/mypage/profile">닉네임 수정 ›</Link>
        <Link to="/creator/profile">활동 프로필·채널 정보 관리 ›</Link>
      </section>
      <PhoneVerification />
      <SocialLoginLinks notice={location.state?.linkNotice} />
      <ChannelConnections notice={location.state?.channelNotice} />
      <section className="account-settings-group">
        <h2>로그인 및 배송 정보</h2>
        <Link to="/settings/security">
          비밀번호 변경 <span>›</span>
        </Link>
        <Link to="/mypage/addresses">
          배송지 관리 <span>›</span>
        </Link>
        <p>
          주소록 변경은 기존 캠페인 신청의 배송 정보에 영향을 주지 않습니다.
        </p>
      </section>
      <LogoutButton className="buyer-v2-button buyer-v2-button--secondary" />
    </BuyerLayout>
  )
}
