/**
 * 일반 안내·인증 화면에서 홈과 도움말, 로그인/마이페이지 링크를 표시합니다.
 * 세션 토큰의 존재는 링크 선택에만 사용하며 서버 권한 판단은 수행하지 않습니다.
 */
import { Link } from 'react-router-dom'

function CommonHeader() {
  const loggedIn = Boolean(sessionStorage.getItem('accessToken'))
  return (
    <header className="common-header">
      <div className="hd_box">
        <Link to="/home" className="hd_box__logo">
          MOVRIT
        </Link>
        <nav>
          <Link to="/support">도움말</Link>
          <Link to={loggedIn ? '/mypage' : '/login'}>
            {loggedIn ? '마이페이지' : '로그인'}
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default CommonHeader
