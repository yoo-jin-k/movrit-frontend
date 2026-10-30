/**
 * 인증·안내 페이지가 공통 헤더·제목·본문·푸터 구조를 재사용하도록 감쌉니다.
 * 개별 폼의 입력 상태와 저장 책임은 children에 남깁니다.
 * hideTitle은 카드 안에 같은 제목이 있는 로그인·회원가입처럼 제목 중복을 피할 때 사용하며,
 * 화면에서는 숨기되 스크린리더용 페이지 제목은 유지합니다.
 */
import CommonHeader from './CommonHeader'
import SiteFooter from './SiteFooter'

function CommonLayout({ title, children, className = '', hideTitle = false }) {
  return (
    <div className={`common-page ${className}`}>
      <CommonHeader />
      <main className="common-page__main">
        <h1 className={hideTitle ? 'visually-hidden' : undefined}>{title}</h1>
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}

export default CommonLayout
