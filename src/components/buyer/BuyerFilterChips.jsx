/**
 * 선택된 필터와 변경 콜백을 부모에게 받아 탭 형태로 표시합니다.
 * 데이터를 직접 조회하지 않고 클릭한 필터 키만 부모에게 전달합니다.
 */
const FILTERS = [
  { key: 'closing', label: '마감 임박' },
  { key: 'new', label: '새로 오픈' },
  { key: 'popular', label: '인기순' },
  { key: 'beauty', label: '뷰티' },
  { key: 'fashion', label: '패션' },
]

function BuyerFilterChips({ value, onChange }) {
  return (
    <div
      className="buyer-filter-chips"
      role="tablist"
      aria-label="프리오더 필터"
    >
      {FILTERS.map((filter) => (
        <button
          key={filter.key}
          type="button"
          className={`buyer-filter-chip${value === filter.key ? ' buyer-filter-chip--active' : ''}`}
          onClick={() => onChange(filter.key)}
          role="tab"
          aria-selected={value === filter.key}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

export default BuyerFilterChips
