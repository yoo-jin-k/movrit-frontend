import { Link } from 'react-router-dom'

function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/preorders" className="app-header__logo">MOVRIT</Link>
        <nav className="app-header__nav" aria-label="주요 메뉴">
          <Link to="/preorders">프리오더</Link>
          <Link to="/favorites">관심</Link>
          <Link to="/orders">주문</Link>
          <Link to="/notifications">알림</Link>
          <Link to="/mypage">마이</Link>
        </nav>
      </div>
    </header>
  )
}

export default AppHeader
