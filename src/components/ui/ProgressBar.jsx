/**
 * 표시할 진행률을 숫자로 바꾸고 0~100 범위로 제한합니다.
 * 원래 업무 수치를 바꾸지 않고 막대의 너비와 접근성 안내에만 제한값을 사용합니다.
 */
function ProgressBar({ value = 0 }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className="progress" aria-label={`달성률 ${safeValue}%`}>
      <div className="progress__bar" style={{ width: `${safeValue}%` }} />
    </div>
  )
}

export default ProgressBar
