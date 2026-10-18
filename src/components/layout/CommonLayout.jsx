/**
 * 인증·안내 페이지가 공통 헤더와 제목·본문 구조를 재사용하도록 감쌉니다.
 * 개별 폼의 입력 상태와 저장 책임은 children에 남깁니다.
 */
import CommonHeader from './CommonHeader'

function CommonLayout({ title, children, className = '' }) {
  return (
    <div className={`common-page ${className}`}>
      <CommonHeader />
      <main className="common-page__main">
        <h1>{title}</h1>
        {children}
      </main>
    </div>
  )
}

export default CommonLayout
