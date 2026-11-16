/**
 * 사용자 화면 공통 푸터입니다.
 * 메인·탐색·계정·안내 화면이 같은 브랜드 문구와 고객 안내 링크를 보여주도록 한 곳에서 관리합니다.
 * 스타일은 메인 화면 스타일시트(_main-home.scss)의 discovery-footer 규칙을 그대로 사용합니다.
 * 모바일 하단 탭 바도 푸터와 함께 렌더링해 사용자 화면 전체에 같은 이동 메뉴를 제공합니다.
 */
import { Link } from 'react-router-dom'
import MobileTabBar from './MobileTabBar'

export default function SiteFooter() {
  return (
    <>
      <footer className="discovery-footer">
        <div className="discovery-width discovery-footer__main">
          <div>
            <Link to="/home" className="discovery-footer__logo">
              MOVRIT
            </Link>
            <p>브랜드와 크리에이터를 잇는 새로운 경험</p>
            <p>좋아하는 브랜드와 나만의 이야기를 만들어보세요.</p>
            <strong>© MOVRIT. All Rights Reserved.</strong>
          </div>
          <div>
            <h2>광고 및 서비스 문의</h2>
            <Link to="/support">문의하기 →</Link>
          </div>
        </div>
        <div className="discovery-footer__bottom">
          <div className="discovery-width">
            <Link to="/community/guide">서비스 가이드</Link>
            <Link to="/notices">공지사항</Link>
            <Link to="/settings/terms">이용약관 및 개인정보 안내</Link>
            <Link to="/support">고객센터</Link>
            <span>대한민국 ⌃</span>
          </div>
        </div>
      </footer>
      <MobileTabBar />
    </>
  )
}
