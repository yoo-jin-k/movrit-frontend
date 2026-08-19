import { Link } from 'react-router-dom'

function CommonHeader() {
  const loggedIn = Boolean(sessionStorage.getItem('accessToken'))
  return (
    <header className="common-header">
      <Link to="/home" className="common-header__logo">MOVRIT</Link>
      <nav>
        <Link to="/support">도움말</Link>
        <Link to={loggedIn ? '/mypage' : '/login'}>{loggedIn ? '마이페이지' : '로그인'}</Link>
      </nav>
    </header>
  )
}

export default CommonHeader
