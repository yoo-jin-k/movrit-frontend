/**
 * 탐색용 헤더·푸터·안내 영역을 공유하고 경로 변경 시 화면 위치를 정리합니다.
 * 개별 목록과 상세의 조회·오류 처리는 하위 화면에 맡깁니다.
 */
import { useEffect } from 'react'
import { useCampaignPreview } from './useCampaignCatalog'
import { useLocation } from 'react-router-dom'
import MainHomeHeader from '../../components/buyer/MainHomeHeader'
import SiteFooter from '../../components/layout/SiteFooter'
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
      <SiteFooter />
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
