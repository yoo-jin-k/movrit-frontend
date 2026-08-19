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
