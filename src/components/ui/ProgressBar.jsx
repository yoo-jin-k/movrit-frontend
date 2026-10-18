function ProgressBar({ value = 0 }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className="progress" aria-label={`달성률 ${safeValue}%`}>
      <div className="progress__bar" style={{ width: `${safeValue}%` }} />
    </div>
  )
}

export default ProgressBar
