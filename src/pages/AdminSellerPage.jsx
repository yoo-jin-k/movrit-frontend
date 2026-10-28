/**
 * 업체 목록 응답을 화면 필드와 한국어 상태로 정규화해 필터링합니다.
 * 빈 목록·조회 실패를 구분하고 업체 검색과 실제 상세 조회로 연결합니다.
 */
import { useState } from 'react'
import useBusinessList from '../features/business/useBusinessList'
import { Link } from 'react-router-dom'
import AdminLayout, {
  AdminCard,
  AdminStatus,
} from '../components/admin/AdminLayout'

export default function AdminSellerPage() {
  const state = useBusinessList('/admin/sellers')
  const items = state.data
  const [filter, setFilter] = useState('전체')
  const [search, setSearch] = useState('')
  const normalized = items.map((x) => ({
    id: x.id,
    brand: x.brandName || x.brand,
    owner: x.representativeName || x.owner,
    number: x.businessNumber || x.number,
    date: x.createdAt?.slice(0, 10) || x.date,
    status:
      { PENDING: '심사 대기', APPROVED: '승인', REJECTED: '반려' }[x.status] ||
      x.status,
  }))
  const shown = normalized.filter(
    (x) =>
      (filter === '전체' || x.status === filter) &&
      `${x.brand || ''} ${x.number || ''}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  )
  return (
    <AdminLayout title="업체 관리">
      <div className="admin-filters">
        <input
          aria-label="업체 검색"
          placeholder="업체명, 사업자번호 검색"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="admin-chips">
          {['전체', '심사 대기', '승인', '반려'].map((x) => (
            <button
              key={x}
              className={filter === x ? 'is-active' : ''}
              onClick={() => setFilter(x)}
            >
              {x}
            </button>
          ))}
        </div>
      </div>
      <button
        className="admin-button"
        disabled={state.loading}
        onClick={state.reload}
      >
        새로고침
      </button>
      {state.loading ? (
        <p role="status">업체 목록을 불러오고 있습니다.</p>
      ) : state.error ? (
        <p role="alert">{state.error}</p>
      ) : !shown.length ? (
        <p>조건에 맞는 업체가 없습니다.</p>
      ) : null}
      <AdminCard title="업체 목록" subtitle={`총 ${shown.length}건`}>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>업체</th>
                <th>대표자</th>
                <th>사업자번호</th>
                <th>신청일</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((x) => (
                <tr key={x.id}>
                  <td data-label="업체">
                    <strong>{x.brand}</strong>
                  </td>
                  <td data-label="대표자">{x.owner}</td>
                  <td data-label="사업자번호">{x.number}</td>
                  <td data-label="신청일">{x.date}</td>
                  <td data-label="상태">
                    <AdminStatus
                      tone={
                        x.status === '승인'
                          ? 'success'
                          : x.status === '반려'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {x.status}
                    </AdminStatus>
                  </td>
                  <td>
                    <Link
                      className="admin-button admin-button--secondary"
                      to={`/admin/sellers/${x.id}`}
                    >
                      상세
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminLayout>
  )
}
