/**
 * 업체 화면의 제목·상태·목록 상태·상세 대화상자·카드를 공통 제공합니다.
 * 목록의 실패와 비어 있음을 분리하고 대화상자는 브라우저의 모달 초점 처리를 사용합니다.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { dateLabel, statusNames } from './businessModel'
import { closeDecision, isOutsideRect } from './dialogCloseModel'
import { UnsavedContext } from './dialogUnsaved'
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
// 로딩·오류·빈 목록을 순서대로 판정하므로 오류를 등록 내역 없음으로 숨기지 않습니다.
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
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      d="M6 6l12 12M18 6L6 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

// Native dialog는 배경을 inert 처리하고 키보드 초점을 가둡니다. 닫을 때 실행 버튼으로 복귀합니다.
// 닫기: 오른쪽 위 X 버튼·Esc·바깥(어두운 영역) 클릭. 저장하지 않은 입력이 있으면 확인 안내를 먼저 띄웁니다.
// unsaved: 상세 창을 연 화면이 직접 가진 입력의 미저장 여부입니다(안쪽 컴포넌트는 useDialogUnsaved로 알립니다).
export function DetailDialog({
  title,
  onClose,
  children,
  busy = false,
  unsaved = false,
}) {
  const ref = useRef(null),
    keepRef = useRef(null),
    pressedOutside = useRef(false),
    titleId = useId()
  const [dirtyKeys, setDirtyKeys] = useState(() => new Set())
  const [confirming, setConfirming] = useState(false)
  const report = useCallback((key, dirty) => {
    setDirtyKeys((current) => {
      if (current.has(key) === dirty) return current
      const next = new Set(current)
      if (dirty) next.add(key)
      else next.delete(key)
      return next
    })
  }, [])
  const hasUnsaved = unsaved || dirtyKeys.size > 0

  useEffect(() => {
    // 모달을 열기 전 초점을 저장하여 닫거나 화면에서 제거될 때 원래 실행 요소로 돌려줍니다.
    const previous = document.activeElement
    const dialog = ref.current
    dialog.showModal()
    return () => {
      dialog.close()
      previous?.focus()
    }
  }, [])
  useEffect(() => {
    if (confirming) keepRef.current?.focus()
  }, [confirming])

  const requestClose = () => {
    const decision = closeDecision({ busy, unsaved: hasUnsaved })
    if (decision === 'close') onClose()
    else if (decision === 'confirm') setConfirming(true)
  }
  const outside = (event) =>
    event.target === ref.current &&
    isOutsideRect(
      ref.current.getBoundingClientRect(),
      event.clientX,
      event.clientY,
    )

  return (
    <dialog
      ref={ref}
      className="business-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
      // 창 안에서 누른 채 바깥에서 떼는 경우(글자 드래그 등)는 닫지 않도록, 누른 곳과 뗀 곳이 모두 바깥일 때만 닫습니다.
      onMouseDown={(event) => {
        pressedOutside.current = outside(event)
      }}
      onClick={(event) => {
        if (pressedOutside.current && outside(event)) requestClose()
        pressedOutside.current = false
      }}
    >
      <UnsavedContext.Provider value={report}>
        <div className="business-dialog-head">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="business-dialog-close"
            onClick={requestClose}
            disabled={busy}
            aria-label="닫기"
            title="닫기"
          >
            <CloseIcon />
          </button>
        </div>
        {children}
        {confirming && (
          <div
            className="business-dialog-confirm"
            role="alertdialog"
            aria-label="저장하지 않은 내용 확인"
          >
            <p>
              저장하지 않은 내용이 있습니다. 닫으면 입력한 내용이 사라집니다.
            </p>
            <div className="business-actions">
              <button
                type="button"
                ref={keepRef}
                onClick={() => setConfirming(false)}
              >
                계속 작성
              </button>
              <button
                type="button"
                className="business-dialog-discard"
                onClick={() => {
                  setConfirming(false)
                  onClose()
                }}
              >
                저장하지 않고 닫기
              </button>
            </div>
          </div>
        )}
      </UnsavedContext.Provider>
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
