import { Link, useNavigate } from 'react-router-dom'
import CommonLayout from '../components/layout/CommonLayout'

const notices = [
  ['8월 정산 일정 안내', '2026.08.16'], ['서비스 점검 안내', '2026.08.14'],
  ['프리오더 이용 정책 변경', '2026.08.10'], ['신규 기능: 역할 전환', '2026.08.05'],
  ['개인정보 처리방침 개정', '2026.08.01'], ['협업 계약 전자서명 안내', '2026.07.28'],
]

export function RoleSwitchPage() {
  const roles = [['구매자', '현재 사용중', '사용중'], ['업체 · LUMENA', '업체 인증 완료', '전환'], ['인플루언서 · @muse.j', '인플루언서 인증 완료', '전환']]
  return <CommonLayout title="역할 전환"><section className="common-card common-card--medium"><h2>사용할 역할을 선택해</h2><p>현재 계정에서 활성화된 역할이야.</p><div className="common-setting-list">{roles.map(([title, meta, action]) => <article key={title}><div><strong>{title}</strong><small>{meta}</small></div><button className={action === '사용중' ? 'is-primary' : ''}>{action}</button></article>)}</div></section></CommonLayout>
}

export function NoticesPage() {
  return <CommonLayout title="공지사항"><section className="common-list-wrap"><label className="common-field common-field--search">검색<input placeholder="공지 제목 검색" /></label><div className="common-notice-list">{notices.map(([title, date], index) => <Link to={`/notices/${index + 1}`} key={title}><div><strong>{title}</strong><small>{date}</small></div><span>›</span></Link>)}</div></section></CommonLayout>
}

export function NoticeDetailPage() {
  return <CommonLayout title="공지 상세"><article className="common-card common-card--wide notice-detail-card"><h2>8월 정산 일정 안내</h2><small>2026.08.16 · 운영팀</small><hr /><p>안녕하세요, MOVRIT입니다.</p><p>8월 업체/크리에이터 정산은 8월 31일 기준으로 확정되며, 검증 완료 후 등록된 계좌로 순차 지급됩니다.</p><p>정산 내역은 각 역할의 정산 관리 화면에서 확인할 수 있습니다.</p><Link className="common-button common-button--secondary" to="/notices">목록으로</Link></article></CommonLayout>
}

const securityItems = [['비밀번호 변경', '90일 전 변경', '관리'], ['2단계 인증', '사용 안 함', '관리'], ['로그인 알림', '사용 중', '사용중'], ['최근 로그인 기기', 'MacBook Pro · iPhone', '관리'], ['연결된 소셜 계정', 'Google · Kakao', '관리']]
const termItems = [['서비스 이용약관', '필수 · 동의 완료', '보기'], ['개인정보 수집/이용', '필수 · 동의 완료', '보기'], ['마케팅 정보 수신', '선택 · 미동의', '동의'], ['맞춤 추천을 위한 활동정보 이용', '선택 · 동의', '철회']]

function SettingsPage({ title, heading, items }) {
  return <CommonLayout title={title}><section className="common-card common-card--settings"><h2>{heading}</h2><div className="common-setting-list">{items.map(([name, meta, action]) => <article key={name}><div><strong>{name}</strong><small>{meta}</small></div><button className={action === '사용중' || action === '동의' ? 'is-primary' : ''}>{action}</button></article>)}</div></section></CommonLayout>
}
export function SecurityPage() { return <SettingsPage title="보안 설정" heading="보안 설정" items={securityItems} /> }
export function TermsPage() { return <SettingsPage title="약관 및 동의" heading="약관 및 동의 현황" items={termItems} /> }

export function WithdrawalPage() {
  return <CommonLayout title="계정 탈퇴"><section className="common-card common-card--withdraw"><h2>계정 탈퇴</h2><p>탈퇴 전 아래 내용을 확인해줘.</p><div className="withdraw-warning"><strong>탈퇴하면 복구할 수 없어</strong><p>• 진행중 주문/환불이 있으면 탈퇴할 수 없어<br />• 진행중 협업/정산이 있으면 먼저 종료해야 해<br />• 법적 보관 의무 데이터는 일정 기간 보관돼</p></div><label className="common-field">확인 문구<input placeholder="탈퇴합니다" /></label><button className="common-button">계정 탈퇴 요청</button></section></CommonLayout>
}

export function NotFoundPage() {
  const navigate = useNavigate()
  return <CommonLayout title="페이지를 찾을 수 없어"><section className="common-card common-card--empty"><strong>404</strong><h2>페이지를 찾을 수 없어</h2><p>주소가 바뀌었거나 삭제된 페이지일 수 있어.</p><button className="common-button" onClick={() => navigate('/home')}>홈으로 돌아가기</button></section></CommonLayout>
}
