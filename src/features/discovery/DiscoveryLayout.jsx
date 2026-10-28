/**
 * 탐색용 헤더·푸터·안내 영역을 공유하고 경로 변경 시 화면 위치를 정리합니다.
 * 개별 목록과 상세의 조회·오류 처리는 하위 화면에 맡깁니다.
 */
import { useEffect } from 'react'
import { useCampaignPreview } from './useCampaignCatalog'
import { Link, useLocation } from 'react-router-dom'
import MainHomeHeader from '../../components/buyer/MainHomeHeader'
import '../../styles/pages/_main-home.scss'

export default function DiscoveryLayout({ children, notice, onCloseNotice }) {
  const { pathname } = useLocation()
  const previewMode = useCampaignPreview()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="main-home">
      <MainHomeHeader key={pathname} />
      {children}
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
      {import.meta.env.DEV && (
        <div className="discovery-demo-label">
          {previewMode ? '개발 미리보기 · 캠페인 예시' : '캠페인 서버 연동'}
        </div>
      )}
      {notice && (
        <div className="main-home__notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={onCloseNotice} aria-label="안내 닫기">
            ×
          </button>
        </div>
      )}
    </div>
  )
}
