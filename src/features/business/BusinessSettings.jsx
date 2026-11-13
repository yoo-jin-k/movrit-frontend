/**
 * 업체 레이아웃이 조회한 승인 프로필을 표시하고 기존 관리 화면으로 연결합니다.
 * 여기서 별도 심사 상태를 만들거나 업체 정보를 자동 변경하지 않습니다.
 * - 사용하는 API: GET /api/brands/mine(운영 중인 브랜드가 없으면 상단에 브랜드 등록 안내). 승인된 업체만 접근합니다.
 *
 * 변경 이력(고치기 전 → 고친 후)
 * - '업체 운영 관리' 이동 항목이 글자 링크라 버튼처럼 보이지 않음 → 테두리·배경·hover·focus가 있는 버튼형 링크.
 * - 브랜드가 없는 업체도 안내 없이 같은 화면 → 상단에 '브랜드 등록하기' 안내와 버튼 표시.
 */
import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { PageHeader } from './BusinessUi'
import { getMyBrands } from '../../api/brandApi'
import { brandSetupState } from './brandModel'
import { sellerStatusLabel } from './sellerEntryModel'
import './businessSeller.css'

const operationLinks = [
  ['/seller/brands', '브랜드 관리', '로고·대표 이미지, 운영 상태'],
  ['/seller/products', '상품 관리', '판매 상품 등록·수정'],
  ['/seller/preorders', '프리오더 관리', '프리오더 판매 현황'],
  ['/seller/operations', '주문·배송 관리', '주문·배송·정산 확인'],
  ['/seller/apply', '사업자 등록 정보', '업체 신청 내용·심사 상태'],
]

export default function BusinessSettings() {
  const { profile } = useOutletContext()
  // 브랜드 목록을 읽기 전·실패 시에는 null로 두어 등록 안내를 띄우지 않습니다(잘못된 안내 방지).
  const [brands, setBrands] = useState(null)
  useEffect(() => {
    let active = true
    getMyBrands()
      .then((data) => {
        if (active) setBrands(Array.isArray(data) ? data : null)
      })
      .catch(() => {
        // 안내 배너는 보조 정보라 실패해도 화면 오류로 띄우지 않습니다. 브랜드 관리 화면에서 다시 확인할 수 있습니다.
      })
    return () => {
      active = false
    }
  }, [])
  const brandState = brandSetupState(brands)
  return (
    <>
      <PageHeader
        title="업체 설정"
        description="승인된 사업자 정보를 확인하고 브랜드·상품 관리 화면으로 이동하세요."
      />
      {brandState && (
        <section
          className="business-brand-notice"
          aria-label="브랜드 등록 안내"
        >
          <div>
            <strong>
              {brandState === 'none'
                ? '아직 등록된 브랜드가 없습니다.'
                : '운영 중인 브랜드가 없습니다.'}
            </strong>
            <p>
              {brandState === 'none'
                ? '브랜드를 등록해야 캠페인에 브랜드 로고와 소개가 표시됩니다.'
                : '비활성 브랜드를 다시 활성화하거나 새 브랜드를 등록해 주세요.'}
            </p>
          </div>
          <Link className="business-primary" to="/seller/brands?new=1">
            {brandState === 'none' ? '브랜드 등록하기' : '브랜드 관리하기'}
          </Link>
        </section>
      )}
      <section className="business-panel business-settings">
        <h2>업체 정보</h2>
        <p>
          심사에 사용된 사업자 정보는 조회 전용입니다. 변경이 필요하면{' '}
          <Link to="/seller/inbox?tab=inquiries">문의하기</Link>로 요청해
          주세요.
        </p>
        <dl className="business-details">
          {[
            ['상호', profile.businessName],
            ['브랜드명', profile.brandName],
            ['대표자', profile.representativeName],
            ['사업자등록번호', profile.businessNumber],
            ['등록 상태', sellerStatusLabel(profile.status)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || '미등록'}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="business-panel">
        <h2>업체 운영 관리</h2>
        <nav className="business-link-buttons" aria-label="업체 운영 관리">
          {operationLinks.map(([to, label, hint]) => (
            <Link key={to} className="business-link-button" to={to}>
              <span>
                {label}
                <small>{hint}</small>
              </span>
            </Link>
          ))}
        </nav>
      </section>
    </>
  )
}
