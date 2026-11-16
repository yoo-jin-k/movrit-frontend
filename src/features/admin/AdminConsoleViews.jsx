/**
 * 운영자 관리 화면에서 함께 쓰는 표시 조각입니다.
 *
 * - ResourceGate: 불러오는 중·오류(다시 시도) 상태를 먼저 보여줍니다.
 * - SearchFilters: 실제로 동작하는 검색어 입력과 상태 칩입니다.
 * - AdminDataTable: 열 정의대로 표를 그리고, 행마다 상세 링크를 붙일 수 있습니다.
 * - DetailHeader·DefinitionList: 상세 화면의 머리글과 '항목: 값' 목록입니다.
 */
import { Link } from 'react-router-dom'
import { AdminCard, AdminStatus } from '../../components/admin/AdminLayout'
import { statusLabel, statusTone } from './adminConsoleModel'

/** 상태 코드를 색 배지로 보여줍니다. */
export function StatusBadge({ code }) {
  return <AdminStatus tone={statusTone(code)}>{statusLabel(code)}</AdminStatus>
}

/** 로딩·오류일 때는 안내를, 정상일 때는 내용을 보여줍니다. */
export function ResourceGate({ state, children }) {
  if (state.loading) return <p role="status">정보를 불러오고 있습니다.</p>
  if (state.error)
    return (
      <div role="alert" className="admin-error">
        <p>{state.error}</p>
        <button
          className="admin-button admin-button--secondary"
          onClick={state.reload}
        >
          다시 시도
        </button>
      </div>
    )
  return children
}

/**
 * 검색어 입력과 상태 칩 줄입니다. chips는 [값, 이름] 목록이며 첫 칩('' = 전체)이 기본입니다.
 * children으로 정렬 선택 같은 추가 조건을 새로고침 버튼 앞에 넣을 수 있습니다.
 */
export function SearchFilters({
  search,
  onSearch,
  placeholder,
  chips = [],
  chip,
  onChip,
  onReload,
  reloading = false,
  children,
}) {
  return (
    <div className="admin-filters">
      <label>
        <span className="sr-only">검색</span>
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={placeholder}
        />
      </label>
      {chips.length > 0 && (
        <div className="admin-chips" role="group" aria-label="상태 필터">
          {chips.map(([value, label]) => (
            <button
              type="button"
              key={label}
              className={chip === value ? 'is-active' : ''}
              aria-pressed={chip === value}
              onClick={() => onChip(value)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {children}
      {onReload && (
        <button
          className="admin-button admin-button--secondary"
          disabled={reloading}
          onClick={onReload}
        >
          새로고침
        </button>
      )}
    </div>
  )
}

/**
 * 표를 그립니다. columns는 {key, label, render(row)} 목록입니다.
 * rowLink(row)를 주면 마지막 칸에 '상세' 링크를 붙입니다.
 */
export function AdminDataTable({
  title,
  rows,
  columns,
  rowLink,
  empty = '조건에 맞는 항목이 없습니다.',
}) {
  return (
    <AdminCard title={title} subtitle={`총 ${rows.length.toLocaleString()}건`}>
      {!rows.length ? (
        <p className="admin-muted">{empty}</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                {rowLink && (
                  <th>
                    <span className="sr-only">상세</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.key} data-label={column.label}>
                      {column.render
                        ? column.render(row)
                        : (row[column.key] ?? '-')}
                    </td>
                  ))}
                  {rowLink && (
                    <td>
                      <Link
                        className="admin-button admin-button--secondary"
                        to={rowLink(row)}
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
      )}
    </AdminCard>
  )
}

/** 상세 화면 머리글입니다. 이름 첫 글자, 부제, 상태 배지, 처리 버튼 자리를 둡니다. */
export function DetailHeader({ name, sub, status, children }) {
  return (
    <AdminCard className="admin-profile">
      <div className="admin-profile__avatar">{name?.slice(0, 1) || 'M'}</div>
      <div>
        <h2>{name || '-'}</h2>
        <p>{sub}</p>
        {status && <StatusBadge code={status} />}
      </div>
      {children && <div className="admin-profile__actions">{children}</div>}
    </AdminCard>
  )
}

/** '항목: 값' 목록입니다. items는 [항목, 값] 목록이며 값이 비면 '-'로 보여줍니다. */
export function DefinitionList({ title, items }) {
  return (
    <AdminCard title={title}>
      <dl className="admin-definition">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {value === null || value === undefined || value === ''
                ? '-'
                : value}
            </dd>
          </div>
        ))}
      </dl>
    </AdminCard>
  )
}

/** 목록으로 돌아가는 링크입니다. */
export function BackLink({ to }) {
  return (
    <Link className="admin-back" to={to}>
      ← 목록으로 돌아가기
    </Link>
  )
}
