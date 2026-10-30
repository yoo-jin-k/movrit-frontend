/**
 * 역할 진입 안내·공지·계정 설정·없는 경로 안내 화면을 제공합니다.
 * 보안 설정은 실제 계정 기능으로 연결하며 역할 링크 선택 자체가 서버 권한을 부여하지 않습니다.
 */
import AccountPasswordPage from '../features/membership/AccountPasswordPage'

import { Link, useNavigate } from 'react-router-dom'
import CommonLayout from '../components/layout/CommonLayout'

const notices = [
  ['8월 정산 일정 안내', '2026.08.16'],
  ['서비스 점검 안내', '2026.08.14'],
  ['프리오더 이용 정책 변경', '2026.08.10'],
  ['신규 기능: 역할 전환', '2026.08.05'],
  ['개인정보 처리방침 개정', '2026.08.01'],
  ['협업 계약 전자서명 안내', '2026.07.28'],
]

// 사용자 참여와 업체 운영의 진입 경로만 안내하며 권한은 서버에서 확인합니다.
export function RoleSwitchPage() {
  return (
    <CommonLayout title="서비스 이용">
      <section className="common-card common-card--medium">
        <h2>이용할 서비스를 선택해 주세요.</h2>
        <p>
          사용자는 캠페인별 조건에 따라 참여할 수 있습니다. 업체 운영은 별도
          등록과 심사가 필요합니다.
        </p>
        <div className="common-setting-list">
          <article>
            <div>
              <strong>사용자</strong>
              <small>캠페인 탐색과 신청, 주문 및 관심 상품 관리</small>
            </div>
            <Link to="/home">캠페인 둘러보기</Link>
          </article>
          <article>
            <div>
              <strong>업체</strong>
              <small>기존 업체 정보와 운영 권한은 그대로 유지됩니다.</small>
            </div>
            <Link to="/seller/apply">업체 등록 및 상태 확인</Link>
            <Link to="/seller/dashboard">업체 관리</Link>
          </article>
        </div>
      </section>
    </CommonLayout>
  )
}

export function NoticesPage() {
  return (
    <CommonLayout title="공지사항">
      <p role="note">
        공지 화면 예시입니다. 아래 일정과 정책은 실제 운영 공지가 아닙니다.
      </p>
      <section className="common-list-wrap">
        <label className="common-field common-field--search">
          검색
          <input placeholder="공지 제목 검색" />
        </label>
        <div className="common-notice-list">
          {notices.map(([title, date], index) => (
            <Link to={`/notices/${index + 1}`} key={title}>
              <div>
                <strong>{title}</strong>
                <small>{date}</small>
              </div>
              <span>›</span>
            </Link>
          ))}
        </div>
      </section>
    </CommonLayout>
  )
}

export function NoticeDetailPage() {
  return (
    <CommonLayout title="공지 상세">
      <p role="note">
        공지 내용 예시입니다. 실제 운영 일정이나 정책을 안내하는 내용이
        아닙니다.
      </p>
      <article className="common-card common-card--wide notice-detail-card">
        <h2>8월 정산 일정 안내</h2>
        <small>2026.08.16 · 운영팀</small>
        <hr />
        <p>안녕하세요, MOVRIT입니다.</p>
        <p>
          8월 업체/크리에이터 정산은 8월 31일 기준으로 확정되며, 검증 완료 후
          등록된 계좌로 순차 지급됩니다.
        </p>
        <p>정산 내역은 각 역할의 정산 관리 화면에서 확인할 수 있습니다.</p>
        <Link className="common-button common-button--secondary" to="/notices">
          목록으로
        </Link>
      </article>
    </CommonLayout>
  )
}

const termItems = [
  ['서비스 이용약관', '필수 · 동의 완료', '보기'],
  ['개인정보 수집/이용', '필수 · 동의 완료', '보기'],
  ['마케팅 정보 수신', '선택 · 미동의', '동의'],
  ['맞춤 추천을 위한 활동정보 이용', '선택 · 동의', '철회'],
]

function SettingsPage({ title, heading, items }) {
  return (
    <CommonLayout title={title}>
      <p role="note">
        설정 화면 예시입니다. 표시된 보안·동의 상태는 실제 계정 상태가 아니며
        변경은 저장되지 않습니다.
      </p>
      <section className="common-card common-card--settings">
        <h2>{heading}</h2>
        <div className="common-setting-list">
          {items.map(([name, meta, action]) => (
            <article key={name}>
              <div>
                <strong>{name}</strong>
                <small>{meta}</small>
              </div>
              <button
                className={
                  action === '사용중' || action === '동의' ? 'is-primary' : ''
                }
              >
                {action}
              </button>
            </article>
          ))}
        </div>
      </section>
    </CommonLayout>
  )
}
export function SecurityPage() {
  return <AccountPasswordPage />
}
export function TermsPage() {
  return (
    <SettingsPage
      title="약관 및 동의"
      heading="약관 및 동의 현황"
      items={termItems}
    />
  )
}

export function WithdrawalPage() {
  return (
    <CommonLayout title="계정 탈퇴">
      <p role="note">
        탈퇴 신청은 아직 연결되지 않았습니다.{' '}
        <Link to="/inquiries">고객센터에 문의해 주세요.</Link>
      </p>
      <section className="common-card common-card--withdraw">
        <h2>계정 탈퇴</h2>
        <p>탈퇴 전 아래 내용을 확인해 주세요.</p>
        <div className="withdraw-warning">
          <strong>탈퇴하면 복구할 수 없습니다</strong>
          <p>
            • 진행중 주문/환불이 있으면 탈퇴할 수 없습니다
            <br />• 진행중 협업/정산이 있으면 먼저 종료해야 합니다
            <br />• 법적 보관 의무 데이터는 일정 기간 보관돼
          </p>
        </div>
        <label className="common-field">
          확인 문구
          <input placeholder="탈퇴합니다" />
        </label>
        <button className="common-button" disabled>
          계정 탈퇴 요청 (준비 중)
        </button>
      </section>
    </CommonLayout>
  )
}

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <CommonLayout title="페이지를 찾을 수 없습니다">
      <section className="common-card common-card--empty">
        <strong>404</strong>
        <h2>페이지를 찾을 수 없습니다</h2>
        <p>주소가 바뀌었거나 삭제된 페이지일 수 있습니다.</p>
        <button className="common-button" onClick={() => navigate('/home')}>
          홈으로 돌아가기
        </button>
      </section>
    </CommonLayout>
  )
}
