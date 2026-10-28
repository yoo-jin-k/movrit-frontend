/** 서버가 반환한 누적 집계만 표시하며 오늘 통계·증감률·가짜 운영 이벤트를 만들지 않습니다. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminDashboard } from '../api/adminApi'
import AdminLayout, { AdminCard } from '../components/admin/AdminLayout'
export default function AdminDashboardPage() {
  const [state, setState] = useState({ loading: true, data: null, error: '' }),
    [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    getAdminDashboard()
      .then((data) => {
        if (!data?.summary) throw new Error('집계 응답 확인 필요')
        if (active) setState({ loading: false, data, error: '' })
      })
      .catch(() => {
        if (active)
          setState({
            loading: false,
            data: null,
            error: '운영 현황을 불러오지 못했습니다.',
          })
      })
    return () => {
      active = false
    }
  }, [attempt])
  return (
    <AdminLayout title="운영 대시보드">
      <button
        className="admin-button"
        disabled={state.loading}
        onClick={() => {
          setState({ loading: true, data: null, error: '' })
          setAttempt((v) => v + 1)
        }}
      >
        새로고침
      </button>
      {state.loading ? (
        <p role="status">운영 현황을 확인하고 있습니다.</p>
      ) : state.error ? (
        <p role="alert">{state.error}</p>
      ) : (
        <>
          <div className="admin-kpis">
            {[
              ['members', '회원'],
              ['sellers', '업체'],
              ['creators', '활동 프로필'],
              ['preorders', '전체 프리오더'],
              ['orders', '전체 주문'],
              ['pendingSettlements', '정산 대기'],
            ].map(([key, label]) => (
              <article key={key}>
                <span>{label}</span>
                <strong>
                  {state.data.summary[key] == null
                    ? '미제공'
                    : Number(state.data.summary[key]).toLocaleString()}
                </strong>
                <small>서버 누적 집계</small>
              </article>
            ))}
          </div>
          <AdminCard title="운영 관리">
            <div className="admin-task-list">
              {[
                ['업체 심사', '/admin/sellers'],
                ['문의 확인', '/admin/inquiries'],
                ['캠페인 참여자', '/admin/campaign-participants'],
              ].map(([label, to]) => (
                <Link className="admin-button" key={to} to={to}>
                  {label} →
                </Link>
              ))}
            </div>
          </AdminCard>
          <AdminCard title="서버 제공 운영 목록">
            {[
              ['preorders', '프리오더'],
              ['collaborations', '협업'],
              ['settlements', '정산'],
            ].map(([key, label]) => (
              <section key={key}>
                <h3>{label}</h3>
                {!Array.isArray(state.data[key]) ? (
                  <p>정보 미제공</p>
                ) : !state.data[key].length ? (
                  <p>등록된 내역이 없습니다.</p>
                ) : (
                  <ul>
                    {state.data[key].slice(0, 5).map((item) => (
                      <li key={item.id}>
                        {item.title} · {item.status}
                        <p>{item.detail}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </AdminCard>
        </>
      )}
    </AdminLayout>
  )
}
