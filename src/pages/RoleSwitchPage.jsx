/**
 * 이용 서비스 선택 화면(/roles, 로그인 회원)입니다. 참여자 화면과 업체 화면으로 가는 버튼과 각 버튼의 동작을 설명합니다.
 * - 사용하는 API: GET /api/sellers/me(업체 신청 상태, 404는 미신청).
 * - 버튼은 화면 이동만 하며 계정 권한을 바꾸지 않습니다. 업체 화면 권한은 서버가 확인합니다.
 *
 * 변경 이력(고치기 전 → 고친 후)
 * - CommonPages.jsx 안에서 '캠페인 둘러보기'·'업체 등록 및 상태 확인'·'업체 관리'가 설명 없이 글자 링크로만 있었음
 *   → 별도 파일로 옮기고, 역할마다 할 수 있는 일과 각 버튼의 동작을 적고, 업체 신청 상태에 맞는 버튼을 버튼 모양으로 표시.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CommonLayout from '../components/layout/CommonLayout'
import { getMySellerProfile } from '../api/sellerApi'
import { businessEntry } from '../features/business/sellerEntryModel'

export function RoleSwitchPage() {
  const [seller, setSeller] = useState({
    loading: true,
    profile: null,
    failed: false,
  })
  useEffect(() => {
    let active = true
    getMySellerProfile()
      .then((profile) => {
        if (active) setSeller({ loading: false, profile, failed: false })
      })
      .catch((error) => {
        if (active)
          setSeller({
            loading: false,
            profile: null,
            failed: error.response?.status !== 404,
          })
      })
    return () => {
      active = false
    }
  }, [])
  const entry = businessEntry(seller.profile, seller.failed)
  return (
    <CommonLayout title="서비스 이용">
      <section className="common-card common-card--medium">
        <h2>어떤 화면으로 이동할까요?</h2>
        <p>
          한 계정으로 참여자 화면과 업체 화면을 모두 쓸 수 있습니다. 아래 버튼은
          화면만 바꿔 주며, 계정 정보나 권한은 바뀌지 않습니다.
        </p>
        <div className="role-entry-list">
          <article className="role-entry">
            <h3>참여자로 이용</h3>
            <p>캠페인을 찾아 신청하고, 선정되면 체험 후 콘텐츠를 제출합니다.</p>
            <ul>
              <li>
                캠페인 둘러보기: 모집 중인 캠페인이 있는 홈으로 이동합니다.
              </li>
              <li>내 캠페인: 신청·선정·콘텐츠 제출 진행 상황을 확인합니다.</li>
            </ul>
            <div className="seller-entry-actions">
              <Link className="seller-entry-button is-primary" to="/home">
                캠페인 둘러보기
              </Link>
              <Link className="seller-entry-button" to="/mypage/campaigns">
                내 캠페인
              </Link>
            </div>
          </article>
          <article className="role-entry">
            <h3>업체로 이용</h3>
            <p>
              캠페인을 열고 참여자를 선정·관리합니다. 업체 신청 후 운영자 승인이
              있어야 업체 화면을 쓸 수 있습니다.
            </p>
            <p className="role-entry-status" role="status">
              {seller.loading
                ? '업체 신청 상태를 확인하고 있습니다.'
                : entry.summary}
            </p>
            <ul>
              <li>
                업체 신청하기·신청 상태 확인: 사업자 정보를 내고 심사 결과를
                확인합니다.
              </li>
              <li>
                업체 화면으로 이동: 승인된 업체의 캠페인·참여자·알림 관리 화면을
                엽니다.
              </li>
            </ul>
            {!seller.loading && (
              <div className="seller-entry-actions">
                <Link
                  className="seller-entry-button is-primary"
                  to={entry.primary.to}
                >
                  {entry.primary.label}
                </Link>
                {entry.secondary && (
                  <Link className="seller-entry-button" to={entry.secondary.to}>
                    {entry.secondary.label}
                  </Link>
                )}
              </div>
            )}
          </article>
        </div>
      </section>
    </CommonLayout>
  )
}
