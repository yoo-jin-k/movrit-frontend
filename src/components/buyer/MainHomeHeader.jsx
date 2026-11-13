/**
 * 참여자 화면 공통 헤더입니다(두 줄 구성).
 *
 * 1줄: 로고 · 검색창 · 메시지/알림/찜 아이콘 · 로그인(또는 계정 메뉴)
 * 2줄: 전체 메뉴 버튼 · 주요 메뉴(알약 모양, 현재 메뉴는 진하게) · 업체용 캠페인 등록 안내
 *
 * - 검색어는 /search?q= 로 넘깁니다.
 * - 로그인 상태는 세션의 접근 토큰으로 판단하고, 로그인·로그아웃 이벤트(movrit:session-updated)를 받아 다시 그립니다.
 * - 전체 메뉴는 Escape 키나 메뉴 이동으로 닫힙니다.
 * - 아이콘은 모두 이 파일의 단순 SVG로 그립니다(외부 이미지 파일을 쓰지 않습니다).
 */
import { useEffect, useState } from 'react'
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import AccountMenu from './AccountMenu'
import useUnreadNotifications from '../../features/notifications/useUnreadNotifications'
import useChatUnread from '../../features/chat/useChatUnread'
import { unreadBadgeText } from '../../features/notifications/notificationBadge'
import { HeartIcon } from '../../features/discovery/FavoriteButton'
import {
  LOCAL_CATEGORIES,
  MENU_ITEMS,
  PRODUCT_CATEGORIES,
} from '../../features/discovery/catalog'

// 헤더 아이콘 공통 선 스타일입니다.
const LINE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

// 돋보기(검색)
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="6.5" {...LINE} strokeWidth="2" />
      <path d="M16 16l4 4" {...LINE} strokeWidth="2" />
    </svg>
  )
}

// 말풍선(메시지)
function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 5.5h16v11H9.5L5 20v-3.5H4z" {...LINE} />
      <path d="M8 9.5h8M8 12.5h5" {...LINE} />
    </svg>
  )
}

// 종(알림)
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 16.5V11a6 6 0 0112 0v5.5l1.5 1.5h-15z" {...LINE} />
      <path d="M10 20.5a2 2 0 004 0" {...LINE} />
    </svg>
  )
}

// 네모 네 칸(전체 메뉴)
function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" {...LINE} />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" {...LINE} />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" {...LINE} />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" {...LINE} />
    </svg>
  )
}

/** 페이지를 옮기면 이전 검색 입력과 열린 메뉴가 남지 않도록 주소가 바뀔 때 새로 그립니다. */
export default function MainHomeHeader() {
  const { pathname, search } = useLocation()
  return <HeaderContent key={`${pathname}${search}`} />
}

function HeaderContent() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState(params.get('q') || '')
  const [menuOpen, setMenuOpen] = useState(false)
  const unread = useUnreadNotifications()
  const badge = unreadBadgeText(unread)
  // 메시지 아이콘의 안 읽은 채팅 수입니다.
  const chatBadge = unreadBadgeText(useChatUnread())
  const [loggedIn, setLoggedIn] = useState(() =>
    Boolean(sessionStorage.getItem('accessToken')),
  )
  useEffect(() => {
    const refresh = () =>
      setLoggedIn(Boolean(sessionStorage.getItem('accessToken')))
    window.addEventListener('movrit:session-updated', refresh)
    return () => window.removeEventListener('movrit:session-updated', refresh)
  }, [])
  const closeMenu = () => setMenuOpen(false)

  return (
    <header
      className="main-home-header"
      onKeyDown={(event) => {
        if (event.key === 'Escape') closeMenu()
      }}
    >
      {/* 1줄: 로고 · 검색 · 개인 메뉴 */}
      <div className="discovery-width main-home-header__row">
        <Link to="/home" className="main-home-header__logo">
          <span className="main-home-header__mark" aria-hidden="true" />
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
            placeholder="브랜드, 제품, 지역을 검색해 보세요"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" aria-label="검색">
            <SearchIcon />
          </button>
        </form>
        <nav className="main-home-header__actions" aria-label="개인 메뉴">
          {/* 메시지(업체·운영팀 채팅). 안 읽은 메시지가 있으면 개수를 띄웁니다. */}
          {loggedIn && (
            <Link
              to="/messages"
              className="main-home-header__icon"
              aria-label={
                chatBadge ? `메시지, 안 읽은 메시지 ${chatBadge}개` : '메시지'
              }
            >
              <MessageIcon />
              {chatBadge && (
                <span className="main-home-header__badge" aria-hidden="true">
                  {chatBadge}
                </span>
              )}
            </Link>
          )}
          {/* 알림(선정 결과·수정 요청 등). 읽지 않은 알림 수를 띄웁니다. */}
          <Link
            to="/notifications"
            className="main-home-header__icon"
            aria-label={badge ? `알림, 읽지 않은 알림 ${unread}개` : '알림'}
          >
            <BellIcon />
            {badge && (
              <span className="main-home-header__badge" aria-hidden="true">
                {badge}
              </span>
            )}
          </Link>
          <Link
            to="/favorites"
            className="main-home-header__icon"
            aria-label="찜"
          >
            <HeartIcon />
          </Link>
          {loggedIn ? (
            <AccountMenu />
          ) : (
            <Link className="main-home-header__login" to="/login">
              로그인
            </Link>
          )}
        </nav>
      </div>

      {/* 2줄: 전체 메뉴 · 주요 메뉴 · 업체 안내 */}
      <div className="discovery-width main-home-header__menu">
        <button
          type="button"
          className="main-home-header__all"
          aria-label="전체 메뉴"
          aria-expanded={menuOpen}
          aria-controls="discovery-mega-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <GridIcon />
          <span aria-hidden="true">전체</span>
        </button>
        <nav className="main-home-header__nav" aria-label="주요 메뉴">
          {MENU_ITEMS.map(([label, to]) => (
            <NavLink key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>
        <Link to="/seller/apply" className="main-home-header__business">
          업체이신가요? <strong>캠페인 등록 →</strong>
        </Link>
      </div>

      {/* 전체 메뉴: 제품·지역 세부 분류와 서비스·안내 링크 */}
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
                  onClick={closeMenu}
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
                  onClick={closeMenu}
                >
                  {category}
                </Link>
              ))}
            </div>
            <div>
              <h2>서비스</h2>
              {MENU_ITEMS.slice(3).map(([label, to]) => (
                <Link key={to} to={to} onClick={closeMenu}>
                  {label}
                </Link>
              ))}
            </div>
            <div>
              <h2>안내</h2>
              <Link to="/community/guide" onClick={closeMenu}>
                이용 가이드
              </Link>
              <Link to="/notices" onClick={closeMenu}>
                공지사항
              </Link>
              <Link to="/support" onClick={closeMenu}>
                고객센터
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
