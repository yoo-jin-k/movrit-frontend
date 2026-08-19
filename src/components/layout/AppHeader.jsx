import { Link } from 'react-router-dom'
import HeaderIconLink from './HeaderIconLink'

const PRIMARY_LINKS = [
  { to: '/preorders', label: '프리오더' },
  { to: '/preorders', label: '카테고리' },
  { to: '/creator/profile', label: '크리에이터' },
  { to: '/inquiries', label: '공지사항' },
]

const ACTION_LINKS = [
  { to: '/preorders', label: '검색', icon: '/assets/icons/search.svg' },
  { to: '/favorites', label: '찜', icon: '/assets/icons/heart.svg' },
  { to: '/notifications', label: '알림', icon: '/assets/icons/bell.svg' },
]

function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/home" className="app-header__logo">MOVRIT</Link>
        <nav className="app-header__nav" aria-label="주요 메뉴">
          {PRIMARY_LINKS.map((item) => <Link key={item.label} to={item.to}>{item.label}</Link>)}
        </nav>
        <nav className="app-header__actions" aria-label="개인 메뉴">
          {ACTION_LINKS.map((item) => <HeaderIconLink key={item.label} {...item} />)}
          <Link to="/mypage" className="app-header__mypage">마이페이지</Link>
        </nav>
      </div>
    </header>
  )
}

export default AppHeader
