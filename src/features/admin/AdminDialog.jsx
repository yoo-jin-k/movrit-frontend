/**
 * 운영자 화면에서 목록 위에 띄우는 모달 창입니다(조건 설정·숨기기·신청 상세 등).
 *
 * - 브라우저 기본 dialog(showModal)를 써서 배경을 조작할 수 없게 하고 키보드 초점을 창 안에 둡니다.
 * - Esc 또는 '닫기'로 닫습니다. 처리 중(busy)에는 닫지 않습니다.
 * - 열려 있는 동안 바깥 페이지 스크롤을 잠그고, 닫히면 연 버튼으로 초점을 돌려줍니다.
 *   연 버튼이 목록 새로고침으로 사라졌다면 페이지 제목으로 초점을 옮깁니다.
 */
import { useEffect, useId, useRef } from 'react'

export default function AdminDialog({
  title,
  onClose,
  busy = false,
  closeLabel = '닫기',
  wide = false,
  children,
}) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const previous = document.activeElement
    const dialog = ref.current
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus()
        return
      }
      const heading = document.querySelector('.admin-main h1')
      if (heading) {
        heading.setAttribute('tabindex', '-1')
        heading.focus()
      }
    }
  }, [])

  return (
    <dialog
      ref={ref}
      className={`admin-dialog${wide ? ' admin-dialog--wide' : ''}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Esc는 브라우저가 바로 닫지 않게 막고, 화면 상태로 닫습니다.
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <header className="admin-dialog__head">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="admin-button admin-button--secondary"
          onClick={onClose}
          disabled={busy}
        >
          {closeLabel}
        </button>
      </header>
      <div className="admin-dialog__body">{children}</div>
    </dialog>
  )
}
