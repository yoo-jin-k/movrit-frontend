/**
 * 운영 대시보드를 조회하고 카드와 이벤트 목록으로 표시합니다.
 * 현재 구현은 조회 실패 및 일부 누락 값에 예시 통계를 사용하므로 모든 표시값을 실운영 통계로 간주하지 않습니다.
 */
import { useEffect, useState } from 'react'
import { getAdminDashboard } from '../api/adminApi'
import AdminLayout, {
  AdminButton,
  AdminCard,
} from '../components/admin/AdminLayout'

const preview = {
  summary: { orders: 326, preorders: 28, reviews: 14, refunds: 9 },
  events: [
    '프리오더 PR-260816-031 심사 요청',
    '업체 LUMENA 사업자 서류 수정 제출',
    '주문 MR-260815-093 환불 요청',
    '계약 COL-260814-011 양측 서명 완료',
  ],
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null)
  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch(() => setData(preview))
  }, [])
  const summary = data?.summary || preview.summary
  const values = [
    ['오늘 주문', summary.todayOrders ?? summary.orders ?? 326, '+12%'],
    [
      '진행 프리오더',
      summary.activePreorders ?? summary.preorders ?? 28,
      '4 마감임박',
    ],
    ['심사 대기', summary.pendingReviews ?? summary.reviews ?? 14, '처리 필요'],
    ['환불 요청', summary.refundRequests ?? summary.refunds ?? 9, '3 긴급'],
  ]
  return (
    <AdminLayout title="운영 대시보드">
      <div className="admin-kpis">
        {values.map(([label, value, note]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{Number(value).toLocaleString()}</strong>
            <small>{note}</small>
          </article>
        ))}
      </div>
      <div className="admin-dashboard-grid">
        <AdminCard title="처리할 일" subtitle="우선순위 높은 운영 업무">
          <div className="admin-task-list">
            {[
              ['업체 승인 대기', '4'],
              ['프리오더 심사', '7'],
              ['환불 요청', '9'],
              ['계약 분쟁 확인', '1'],
            ].map(([k, v]) => (
              <div key={k}>
                <strong>
                  {k} {v}
                </strong>
                <AdminButton>열기</AdminButton>
              </div>
            ))}
          </div>
        </AdminCard>
        <AdminCard title="서비스 현황">
          <div className="admin-service-grid">
            <div>
              <b>GMV ₩128.4M</b>
            </div>
            <div>
              <b>활성 구매자 8,240</b>
            </div>
            <div>
              <b>활성 업체 124</b>
            </div>
            <div>
              <b>활성 크리에이터 318</b>
            </div>
          </div>
        </AdminCard>
      </div>
      <AdminCard title="최근 운영 이벤트">
        <ul className="admin-events">
          {(data?.events || preview.events).slice(0, 5).map((e, i) => (
            <li key={i}>
              <span>{typeof e === 'string' ? e : e.title || e.detail}</span>
              <time>{[5, 18, 32, 60][i] || 90}분 전</time>
            </li>
          ))}
        </ul>
      </AdminCard>
    </AdminLayout>
  )
}
