/**
 * 구매자 공통 헤더의 로고·메뉴·개인 링크를 배열에서 렌더링합니다.
 * 네트워크 요청 없이 기존 라우트로 이동하며 알림 수나 권한 상태를 조회하지 않습니다.
 */
import { Link } from 'react-router-dom'
import HeaderIconLink from './HeaderIconLink'

const PRIMARY_LINKS = [
  { to: '/preorders', label: '프리오더' },
  { to: '/preorders', label: '카테고리' },
  { to: '/creator/profile', label: '활동 프로필' },
  { to: '/notices', label: '공지사항' },
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
        {/* 헤더 - 상단 공지사항 */}
        <div className="app-header__top"></div>

        {/* 헤더 - 중간 메인(로고) */}
        <div className="app-header__middle">
          <Link to="/home" className="app-header__logo">
            MOVRIT
          </Link>
          <nav className="app-header__actions" aria-label="개인 메뉴">
            {ACTION_LINKS.map((item) => (
              <HeaderIconLink key={item.label} {...item} />
            ))}
            <Link to="/mypage" className="app-header__mypage">
              마이페이지
            </Link>
          </nav>
        </div>

        {/* 헤더 - 하단 메뉴바 */}
        <div className="app-header__bottom">
          <nav className="app-header__nav" aria-label="주요 메뉴">
            {PRIMARY_LINKS.map((item) => (
              <Link key={item.label} to={item.to}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
