import { Link } from 'react-router-dom'

function CommonHeader() {
  const loggedIn = Boolean(sessionStorage.getItem('accessToken'))
  return (
    <header className="common-header">
        <div className="hd_box">
            <Link to="/home" className="hd_box__logo">MOVRIT</Link>
            <nav>
                <Link to="/support">도움말</Link>
                <Link to={loggedIn ? '/mypage' : '/login'}>{loggedIn ? '마이페이지' : '로그인'}</Link>
            </nav>
        </div>
    </header>
  )
}

export default CommonHeader
