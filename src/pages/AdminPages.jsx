/**
 * 운영자 목록·상세·설정의 디자인 예시 화면을 한 모듈에 제공합니다.
 * preview 데이터와 고정 문구를 사용하며 표시된 승인·정산·설정 버튼을 실제 API 처리로 설명하지 않습니다.
 */
import { Link, useParams } from 'react-router-dom'
import AdminLayout, {
  AdminButton,
  AdminCard,
  AdminStatus,
} from '../components/admin/AdminLayout'
import {
  collaborations,
  creators,
  members,
  preorders,
  refunds,
  sellers,
  settlements,
} from '../preview/adminPreview'

const tone = (status = '') =>
  status.includes('승인') || status.includes('완료') || status.includes('정상')
    ? 'success'
    : status.includes('반려') || status.includes('정지')
      ? 'danger'
      : status.includes('대기') || status.includes('요청')
        ? 'warning'
        : 'neutral'

function Filters({
  placeholder = '이름, 이메일, 번호 검색',
  labels = ['전체', '대기', '승인', '반려'],
}) {
  return (
    <div className="admin-filters">
      <label>
        <span className="sr-only">검색</span>
        <input placeholder={placeholder} />
      </label>
      <div className="admin-chips">
        {labels.map((label, i) => (
          <button className={i === 0 ? 'is-active' : ''} key={label}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

// 미리보기 배열과 열 정의로 운영 목록 레이아웃을 만듭니다. 필터 UI는 실제 서버 검색을 수행하지 않습니다.
function ListPage({ title, subtitle, rows, columns, detailBase, filters }) {
  return (
    <AdminLayout title={title}>
      <Filters {...filters} />
      <AdminCard
        title={subtitle}
        subtitle={`총 ${rows.length.toLocaleString()}건`}
      >
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                {detailBase && (
                  <th>
                    <span className="sr-only">작업</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id || index}>
                  {columns.map((c) => (
                    <td key={c.key} data-label={c.label}>
                      {c.status && c.key === 'status' ? (
                        <AdminStatus tone={tone(row[c.key])}>
                          {row[c.key]}
                        </AdminStatus>
                      ) : (
                        row[c.key]
                      )}
                    </td>
                  ))}
                  {detailBase && (
                    <td>
                      <Link
                        className="admin-button admin-button--secondary"
                        to={`${detailBase}/${row.id}`}
                      >
                        상세
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminLayout>
  )
}

// 선택한 예시 항목의 정보와 활동을 표시합니다. 이 공통 상세의 심사 버튼은 서버 승인 요청과 연결되지 않습니다.
function DetailPage({
  title,
  profile,
  info,
  activity,
  backTo,
  review = false,
}) {
  return (
    <AdminLayout title={title}>
      <AdminCard className="admin-profile">
        <div className="admin-profile__avatar">
          {profile.name?.slice(0, 1) || 'M'}
        </div>
        <div>
          <h2>{profile.name}</h2>
          <p>{profile.sub}</p>
          <AdminStatus tone={tone(profile.status)}>
            {profile.status}
          </AdminStatus>
        </div>
        <div className="admin-profile__actions">
          {review ? (
            <>
              <AdminButton tone="danger">반려</AdminButton>
              <AdminButton tone="primary">승인</AdminButton>
            </>
          ) : (
            <AdminButton>계정 정지</AdminButton>
          )}
        </div>
      </AdminCard>
      <div className="admin-detail-grid">
        <AdminCard title="기본 정보">
          <dl className="admin-definition">
            {Object.entries(info).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </AdminCard>
        <AdminCard title={review ? '심사 체크리스트' : '최근 활동'}>
          <ul className="admin-activity">
            {activity.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </AdminCard>
      </div>
      <Link className="admin-back" to={backTo}>
        ← 목록으로 돌아가기
      </Link>
    </AdminLayout>
  )
}

export function AdminMembersPage() {
  return (
    <ListPage
      title="회원 관리"
      subtitle="회원 목록"
      rows={members}
      detailBase="/admin/members"
      filters={{ labels: ['전체', '구매자', '업체', '인플루언서', '정지'] }}
      columns={[
        { key: 'name', label: '이름' },
        { key: 'email', label: '이메일' },
        { key: 'role', label: '역할' },
        { key: 'status', label: '상태', status: true },
        { key: 'joined', label: '가입일' },
      ]}
    />
  )
}
export function AdminMemberDetailPage() {
  const { id } = useParams()
  const m = members.find((x) => String(x.id) === id) || members[0]
  return (
    <DetailPage
      title="회원 상세"
      profile={{
        name: m.name,
        sub: `${m.email} · ${m.role}`,
        status: m.status,
      }}
      backTo="/admin/members"
      info={{
        휴대폰: '010-0000-0000',
        가입일: m.joined,
        '최근 로그인': '2026.08.16 21:42',
        '주문 수': '18건',
        '누적 결제': '₩628,000',
        '신고/제재': '없음',
      }}
      activity={[
        '프리오더 참여 MR-20260816-00421',
        '배송지 변경',
        '찜 추가 Glow Serum 02',
        '주문 취소 MR-20260720-00318',
      ]}
    />
  )
}
export function AdminSellerDetailPage() {
  const { id } = useParams()
  const s = sellers.find((x) => String(x.id) === id) || sellers[0]
  return (
    <DetailPage
      review
      title="업체 심사 상세"
      profile={{
        name: s.brand,
        sub: `대표 ${s.owner} · ${s.number}`,
        status: s.status,
      }}
      backTo="/admin/sellers"
      info={{
        사업자명: `주식회사 ${s.brand}`,
        대표자: s.owner,
        사업자번호: s.number,
        통신판매업: '2026-서울강남-0184',
        '정산 계좌': '국민은행 000000-00-000000',
        신청일: s.date,
      }}
      activity={[
        '사업자등록증 확인',
        '통신판매업 신고증 확인',
        '정산 계좌 사본 확인',
        '브랜드 소유권 확인',
      ]}
    />
  )
}
export function AdminCreatorsPage() {
  return (
    <ListPage
      title="인플루언서 관리"
      subtitle="인플루언서 목록"
      rows={creators}
      detailBase="/admin/creators"
      filters={{
        placeholder: '활동명, 채널 검색',
        labels: ['전체', '심사 대기', '승인', '보완'],
      }}
      columns={[
        { key: 'name', label: '활동명' },
        { key: 'channel', label: '채널' },
        { key: 'followers', label: '팔로워' },
        { key: 'category', label: '카테고리' },
        { key: 'status', label: '상태', status: true },
      ]}
    />
  )
}
export function AdminCreatorDetailPage() {
  const { id } = useParams()
  const c = creators.find((x) => String(x.id) === id) || creators[0]
  return (
    <DetailPage
      review
      title="인플루언서 심사 상세"
      profile={{
        name: c.name,
        sub: `${c.channel} · 팔로워 ${c.followers}`,
        status: c.status,
      }}
      backTo="/admin/creators"
      info={{
        본명: '김지연',
        카테고리: c.category,
        주요채널: 'Instagram / YouTube',
        '평균 도달': '42,800',
        '평균 참여율': '6.8%',
        신청일: '2026.08.16',
      }}
      activity={[
        '본인 인증 완료',
        '채널 소유권 확인',
        '팔로워 인사이트 제출',
        '정산 계좌 확인',
      ]}
    />
  )
}
export function AdminPreordersPage() {
  return (
    <ListPage
      title="프리오더 심사"
      subtitle="심사 요청 목록"
      rows={preorders}
      detailBase="/admin/preorders"
      filters={{
        placeholder: '프리오더명, 업체명 검색',
        labels: ['전체', '심사 대기', '수정 요청', '승인'],
      }}
      columns={[
        { key: 'id', label: '심사번호' },
        { key: 'title', label: '프리오더' },
        { key: 'seller', label: '업체' },
        { key: 'creator', label: '인플루언서' },
        { key: 'period', label: '진행 기간' },
        { key: 'status', label: '상태', status: true },
      ]}
    />
  )
}
export function AdminPreorderDetailPage() {
  const { id } = useParams()
  const p = preorders.find((x) => x.id === id) || preorders[0]
  return (
    <DetailPage
      review
      title="프리오더 심사 상세"
      profile={{
        name: p.title,
        sub: `${p.seller} × ${p.creator}`,
        status: p.status,
      }}
      backTo="/admin/preorders"
      info={{
        판매가: '38,900원',
        목표수량: '1,000개',
        진행기간: p.period,
        '배송 예정': '2026.09.04',
        수수료율: '18%',
        심사번호: p.id,
      }}
      activity={[
        '상품 정보 및 필수 고지 확인',
        '공급 계약서 확인',
        '콘텐츠 표시광고 문구 확인',
        '배송/환불 정책 확인',
      ]}
    />
  )
}
export function AdminRefundsPage() {
  return (
    <ListPage
      title="주문 / 환불 관리"
      subtitle="환불 요청 목록"
      rows={refunds}
      detailBase="/admin/refunds"
      filters={{
        placeholder: '주문번호, 구매자 검색',
        labels: ['전체', '요청', '검토 중', '완료'],
      }}
      columns={[
        { key: 'id', label: '주문번호' },
        { key: 'buyer', label: '구매자' },
        { key: 'product', label: '상품' },
        { key: 'amount', label: '환불액' },
        { key: 'reason', label: '사유' },
        { key: 'status', label: '상태', status: true },
      ]}
    />
  )
}
export function AdminRefundDetailPage() {
  const { id } = useParams()
  const r = refunds.find((x) => x.id === id) || refunds[0]
  return (
    <DetailPage
      review
      title="환불 상세"
      profile={{
        name: r.product,
        sub: `주문 ${r.id} · ${r.buyer}`,
        status: r.status,
      }}
      backTo="/admin/refunds"
      info={{
        결제금액: r.amount,
        '환불 요청액': r.amount,
        '요청 사유': r.reason,
        '결제 수단': '신용카드',
        '배송 상태': '배송 완료',
        요청일: '2026.08.16 09:42',
      }}
      activity={[
        '구매자 요청 내용 확인',
        '업체 의견 확인',
        '배송 추적 결과 확인',
        '환불 정책 적용 여부 확인',
      ]}
    />
  )
}
export function AdminCollaborationsPage() {
  return (
    <ListPage
      title="협업 / 계약 모니터링"
      subtitle="진행 계약"
      rows={collaborations}
      detailBase="/admin/collaborations"
      columns={[
        { key: 'id', label: '계약번호' },
        { key: 'parties', label: '계약 당사자' },
        { key: 'campaign', label: '캠페인' },
        { key: 'commission', label: '수수료' },
        { key: 'status', label: '상태', status: true },
      ]}
    />
  )
}
export function AdminSettlementsPage() {
  return (
    <ListPage
      title="정산 관리"
      subtitle="정산 배치"
      rows={settlements}
      detailBase="/admin/settlements"
      columns={[
        { key: 'id', label: '정산번호' },
        { key: 'partner', label: '업체' },
        { key: 'sales', label: '총 매출' },
        { key: 'fee', label: '수수료' },
        { key: 'payout', label: '지급액' },
        { key: 'status', label: '상태', status: true },
      ]}
    />
  )
}

export function AdminContentPage() {
  const rows = [
    {
      id: 1,
      title: '8월 서비스 운영 안내',
      type: '공지',
      writer: '운영팀',
      date: '2026.08.16',
      status: '게시 중',
    },
    {
      id: 2,
      title: '프리오더 참여 가이드',
      type: '가이드',
      writer: '콘텐츠팀',
      date: '2026.08.12',
      status: '게시 중',
    },
    {
      id: 3,
      title: '추석 배송 일정 안내',
      type: '공지',
      writer: '운영팀',
      date: '2026.08.10',
      status: '예약',
    },
  ]
  return (
    <ListPage
      title="공지 / 콘텐츠 관리"
      subtitle="콘텐츠 목록"
      rows={rows}
      detailBase="/admin/content"
      columns={[
        { key: 'title', label: '제목' },
        { key: 'type', label: '구분' },
        { key: 'writer', label: '작성자' },
        { key: 'date', label: '등록일' },
        { key: 'status', label: '상태', status: true },
      ]}
    />
  )
}

export function AdminReportsPage() {
  return (
    <AdminLayout title="운영 설정 / 리포트">
      <div className="admin-report-grid">
        <AdminCard title="운영 리포트">
          <div className="admin-metric-list">
            {[
              ['GMV 추이', '+18.2%'],
              ['신규 가입', '+8.4%'],
              ['전환율', '6.8%'],
              ['환불률', '2.1%'],
              ['업체 활성도', '72%'],
              ['크리에이터 활성도', '64%'],
            ].map(([k, v]) => (
              <div key={k}>
                <strong>{k}</strong>
                <b>{v}</b>
                <small>지난 30일 기준</small>
              </div>
            ))}
          </div>
        </AdminCard>
        <Settings />
      </div>
    </AdminLayout>
  )
}
function Settings() {
  const settings = [
    '플랫폼 수수료 10%',
    '프리오더 기본 심사 사용',
    '자동 환불 정책 사용',
    '정산일 매월 말일',
    '계약 전자서명 필수',
    '신고 3회 자동 제한',
  ]
  return (
    <AdminCard title="운영 설정">
      <div className="admin-settings">
        {settings.map((s, i) => (
          <label key={s}>
            <span>{s}</span>
            <input type="checkbox" defaultChecked={i !== 5} />
            <i aria-hidden="true" />
          </label>
        ))}
      </div>
    </AdminCard>
  )
}
export function AdminSettingsPage() {
  return (
    <AdminLayout title="운영 설정">
      <div className="admin-single-column">
        <Settings />
        <AdminCard title="관리자 알림">
          <p className="admin-muted">
            심사, 환불, 신고 이벤트 알림 수신 범위를 설정합니다.
          </p>
          <div className="admin-form-row">
            <input type="email" defaultValue="admin@movrit.kr" />
            <AdminButton tone="primary">저장</AdminButton>
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  )
}
