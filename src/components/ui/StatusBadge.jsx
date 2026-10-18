/**
 * 명시적인 accent 옵션 또는 정해진 강조 문구에 따라 배지 스타일을 선택합니다.
 * 상태 전이나 서버 상태 판정은 수행하지 않습니다.
 */
const accentStatuses = new Set(['오늘 마감', '마감 임박', 'HOT'])

function StatusBadge({ children, accent = false }) {
  const useAccent = accent || accentStatuses.has(String(children))
  return (
    <span className={`status-badge${useAccent ? ' status-badge--accent' : ''}`}>
      {children}
    </span>
  )
}

export default StatusBadge
