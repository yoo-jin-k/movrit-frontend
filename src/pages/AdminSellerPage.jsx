/**
 * 운영자 업체 관리 목록입니다(/admin/sellers).
 * - 서버 API: GET /api/admin/sellers?sort=newest|oldest|name (운영자 전용, 403이면 권한 안내)
 * - 심사 상태 칩(건수 포함)·검색(상호·브랜드·대표자·사업자번호)·정렬(신청일 최신순·오래된순·업체명순)을 제공합니다.
 * - 행의 '상세'에서 업체 정보 확인과 승인·반려를 합니다(AdminSellerDetailPage).
 * - 변경 이력: 필터·새로고침·안내 문구가 따로 놀고 신청일이 비어 보이던 화면 → 회원 관리 등 다른 운영자 목록과 같은
 *   검색 줄·표 구성으로 맞추고, 신청일과 정렬을 추가했습니다.
 */
import { useState } from 'react'
import AdminLayout, { AdminStatus } from '../components/admin/AdminLayout'
import {
  AdminDataTable,
  ResourceGate,
  SearchFilters,
} from '../features/admin/AdminConsoleViews'
import { dateTime, statusTone } from '../features/admin/adminConsoleModel'
import useAdminResource from '../features/admin/useAdminResource'
import {
  SELLER_SORTS,
  SELLER_STATUS_CHIPS,
  SELLER_STATUS_LABELS,
  sellerListPath,
  sellerRows,
  sellerStatusCounts,
  visibleSellers,
} from '../features/admin/adminSellerListModel'

export default function AdminSellerPage() {
  const [sort, setSort] = useState('newest')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const state = useAdminResource(sellerListPath(sort), [])
  const rows = sellerRows(state.data)
  const counts = sellerStatusCounts(rows || [])
  const shown = visibleSellers(rows || [], { status, search, sort })
  const chips = SELLER_STATUS_CHIPS.map(([value, label]) => [
    value,
    `${label} ${counts[value] ?? 0}`,
  ])
  return (
    <AdminLayout title="업체 관리">
      <SearchFilters
        search={search}
        onSearch={setSearch}
        placeholder="상호, 브랜드, 대표자, 사업자번호 검색"
        chips={chips}
        chip={status}
        onChip={setStatus}
        onReload={state.reload}
        reloading={state.loading}
      >
        <label className="admin-sort">
          <span className="sr-only">정렬</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            {SELLER_SORTS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </SearchFilters>
      <ResourceGate state={state}>
        {rows === null ? (
          <div role="alert" className="admin-error">
            <p>업체 목록 응답 형식을 확인할 수 없습니다. 다시 시도해 주세요.</p>
            <button
              className="admin-button admin-button--secondary"
              onClick={state.reload}
            >
              다시 시도
            </button>
          </div>
        ) : (
          <AdminDataTable
            title="업체 목록"
            rows={shown}
            empty={
              rows.length
                ? '조건에 맞는 업체가 없습니다. 검색어나 상태를 바꿔 보세요.'
                : '아직 등록 신청한 업체가 없습니다.'
            }
            rowLink={(row) => `/admin/sellers/${row.id}`}
            columns={[
              {
                key: 'businessName',
                label: '업체',
                render: (r) => (
                  <>
                    <strong>{r.businessName}</strong>
                    {r.brandName && (
                      <>
                        <br />
                        <small className="admin-muted">{r.brandName}</small>
                      </>
                    )}
                  </>
                ),
              },
              { key: 'representativeName', label: '대표자' },
              { key: 'businessNumber', label: '사업자번호' },
              {
                key: 'createdAt',
                label: '신청일',
                render: (r) => dateTime(r.createdAt),
              },
              {
                key: 'status',
                label: '상태',
                render: (r) => (
                  <AdminStatus tone={statusTone(r.status)}>
                    {SELLER_STATUS_LABELS[r.status] || r.status || '-'}
                  </AdminStatus>
                ),
              },
            ]}
          />
        )}
      </ResourceGate>
    </AdminLayout>
  )
}
