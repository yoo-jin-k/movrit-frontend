const accentStatuses = new Set(['오늘 마감', '마감 임박', 'HOT'])

function StatusBadge({ children, accent = false }) {
  const useAccent = accent || accentStatuses.has(String(children))
  return <span className={`status-badge${useAccent ? ' status-badge--accent' : ''}`}>{children}</span>
}

export default StatusBadge
