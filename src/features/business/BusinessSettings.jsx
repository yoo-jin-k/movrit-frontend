/**
 * 업체 레이아웃이 조회한 승인 프로필을 표시하고 기존 관리 화면으로 연결합니다.
 * 여기서 별도 심사 상태를 만들거나 업체 정보를 자동 변경하지 않습니다.
 */
import { Link, useOutletContext } from 'react-router-dom'
import { PageHeader } from './BusinessUi'
export default function BusinessSettings() {
  const { profile } = useOutletContext()
  return (
    <>
      <PageHeader
        title="업체 설정"
        description="등록된 업체 정보와 관리 메뉴를 확인하세요."
      />
      <section className="business-panel business-settings">
        <h2>업체 정보</h2>
        <dl className="business-details">
          {[
            ['상호', profile.businessName],
            ['브랜드명', profile.brandName],
            ['대표자', profile.representativeName],
            ['사업자등록번호', profile.businessNumber],
            [
              '등록 상태',
              profile.status === 'APPROVED' ? '승인 완료' : profile.status,
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || '미등록'}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="business-panel business-settings">
        <h2>업체 운영 관리</h2>
        <div className="business-actions">
          <Link to="/seller/brands">브랜드 관리 →</Link>
          <Link to="/seller/products">상품 관리 →</Link>
          <Link to="/seller/preorders">프리오더 관리 →</Link>
          <Link to="/seller/operations">주문·배송 관리 →</Link>
          <Link to="/seller/apply">사업자 등록 정보 →</Link>
        </div>
      </section>
    </>
  )
}
