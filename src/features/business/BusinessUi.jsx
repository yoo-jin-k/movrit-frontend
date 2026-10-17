import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { dateLabel, statusNames } from './businessModel'
export function PageHeader({ title, description, children }) {
  return (
    <div className="business-heading">
      <div>
        <small>MOVRIT BUSINESS</small>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="business-actions">{children}</div>
    </div>
  )
}
export function StatusBadge({ status }) {
  return (
    <span className={`business-badge business-badge--${status}`}>
      {statusNames[status] || status || '상태 미제공'}
    </span>
  )
}
export function ListState({ state, children }) {
  if (state.loading)
    return (
      <div className="business-empty" role="status">
        정보를 불러오고 있습니다.
      </div>
    )
  if (state.error)
    return (
      <div className="business-empty" role="alert">
        <p>{state.error}</p>
        <button onClick={state.reload}>다시 불러오기</button>
      </div>
    )
  if (!state.data.length)
    return (
      <div className="business-empty">
        <h2>아직 등록된 내역이 없습니다.</h2>
        <p>등록된 정보가 생기면 이곳에서 확인하실 수 있습니다.</p>
      </div>
    )
  return children
}
// Native dialog는 배경을 inert 처리하고 키보드 초점을 가둡니다. 닫을 때 실행 버튼으로 복귀합니다.
export function DetailDialog({ title, onClose, children, busy = false }) {
  const ref = useRef(null),
    titleId = useId()
  useEffect(() => {
    const previous = document.activeElement
    const dialog = ref.current
    dialog.showModal()
    return () => {
      dialog.close()
      previous?.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className="business-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <div className="business-dialog-head">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="상세 닫기"
        >
          닫기
        </button>
      </div>
      {children}
    </dialog>
  )
}
export function CampaignCards({ campaigns }) {
  return (
    <div className="business-cards">
      {campaigns.map((c) => (
        <article className="business-card" key={c.id}>
          <div className="business-card-cover">
            <span>MOVRIT</span>
            <span className="business-badge">{c.open ? '공개' : '비공개'}</span>
          </div>
          <div className="business-card-body">
            <small>
              {c.brandName || '브랜드'} · {c.category || '분류 미제공'}
            </small>
            <h3>{c.title}</h3>
            <p>{c.rewardDescription || '제공 내역 미등록'}</p>
            <p>모집 정원 {c.recruitmentCount ?? '미제공'}명</p>
            <p>모집 마감 · {dateLabel(c.endAt)}</p>
            <div className="business-actions">
              <Link to={`/seller/campaigns/${c.id}`}>캠페인 관리 →</Link>
              <Link to={`/seller/participants?campaignId=${c.id}`}>참여자</Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
