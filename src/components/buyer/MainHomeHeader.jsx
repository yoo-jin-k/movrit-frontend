/**
 * 검색어를 URL 쿼리로 전달하고 카테고리 전체 메뉴를 여닫습니다.
 * 로그인 메뉴는 토큰 존재 여부로 표시하며 메뉴 이동과 Escape 입력 시 펼친 메뉴를 닫습니다.
 */
import { useState } from 'react'
import AccountMenu from './AccountMenu'
import '../../styles/pages/_main-home.scss'
import {
  Link,
  NavLink,
  useNavigate,
  useSearchParams,
  useLocation,
} from 'react-router-dom'
import {
  MENU_ITEMS,
  PRODUCT_CATEGORIES,
  LOCAL_CATEGORIES,
} from '../../features/discovery/catalog'

/** 페이지 이동 후 이전 검색 입력과 열린 메뉴가 남지 않도록 초기화합니다. */
export default function MainHomeHeader() {
  const { pathname, search } = useLocation()
  return <HeaderContent key={`${pathname}${search}`} />
}

function HeaderContent() {
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const loggedIn = Boolean(sessionStorage.getItem('accessToken'))
  return (
    <header
      className="main-home-header"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setMenuOpen(false)
      }}
    >
      <div className="main-home-header__strip">
        <div className="discovery-width">
          <strong>공지사항</strong>
          <Link to="/notices">MOVRIT의 새로운 소식을 확인해 보세요.</Link>
          <div>
            <Link to={loggedIn ? '/mypage' : '/login'}>
              {loggedIn ? '마이페이지' : '로그인'}
            </Link>
            <Link to="/support">광고문의</Link>
            <Link to="/support">고객센터</Link>
          </div>
        </div>
      </div>
      <div className="discovery-width main-home-header__inner">
        <div className="main-home-header__row">
          <Link to="/home" className="main-home-header__logo">
            MOVRIT
          </Link>
          <form
            className="main-home-header__search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              navigate(`/search?q=${encodeURIComponent(query.trim())}`)
            }}
          >
            <input
              type="search"
              aria-label="캠페인 검색"
              placeholder="검색어를 입력해주세요."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" aria-label="검색">
              <img src="/assets/main-home/search.svg" alt="" />
            </button>
          </form>
          <nav className="main-home-header__actions" aria-label="개인 메뉴">
            {loggedIn ? (
              <AccountMenu />
            ) : (
              <Link className="main-home-header__login" to="/login">
                로그인
              </Link>
            )}
            <Link to="/notifications" aria-label="알림">
              <img src="/assets/main-home/bell.svg" alt="" />
            </Link>
            <Link to="/favorites" aria-label="찜">
              <img src="/assets/main-home/heart.svg" alt="" />
            </Link>
          </nav>
        </div>
        <nav className="main-home-header__nav" aria-label="주요 메뉴">
          <button
            type="button"
            aria-label="전체 메뉴"
            aria-expanded={menuOpen}
            aria-controls="discovery-mega-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="discovery-hamburger" />
          </button>
          {MENU_ITEMS.map(([label, to]) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      {menuOpen && (
        <nav
          id="discovery-mega-menu"
          className="discovery-mega-menu"
          aria-label="전체 카테고리"
        >
          <div className="discovery-width">
            <div>
              <h2>제품</h2>
              {PRODUCT_CATEGORIES.map((category) => (
                <Link
                  key={category}
                  to={`/category/제품?category=${category}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {category}
                </Link>
              ))}
            </div>
            <div>
              <h2>지역</h2>
              {LOCAL_CATEGORIES.map((category) => (
                <Link
                  key={category}
                  to={`/category/지역?category=${category}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {category}
                </Link>
              ))}
            </div>
            <div>
              <h2>서비스</h2>
              {MENU_ITEMS.slice(3).map(([label, to]) => (
                <Link key={to} to={to} onClick={() => setMenuOpen(false)}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
