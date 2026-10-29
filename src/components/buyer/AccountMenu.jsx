/**
 * 서버 회원 정보와 업체 승인 상태를 읽어 계정별 이동 링크를 표시합니다.
 * 실명이나 채널 별칭은 닉네임의 대체값으로 노출하지 않으며 메뉴가 권한을 부여하지 않습니다.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import LogoutButton from '../../features/auth/LogoutButton'
import { getMyInfo } from '../../api/authApi'
import { getMySellerProfile } from '../../api/sellerApi'

export default function AccountMenu() {
  const [member, setMember] = useState(null)
  const [approved, setApproved] = useState(false)
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  const root = useRef(null)
  const trigger = useRef(null)

  useEffect(() => {
    let active = true
    const current = () =>
      active && Boolean(sessionStorage.getItem('accessToken'))
    // 프로필 저장 뒤에도 서버 응답을 다시 읽어 닉네임 표시를 갱신합니다.
    const refresh = () => {
      getMyInfo()
        .then((data) => {
          if (current()) {
            setMember(data)
            setFailed(false)
          }
        })
        .catch(() => {
          if (current()) {
            setMember(null)
            setFailed(true)
          }
        })
    }
    refresh()
    getMySellerProfile()
      .then((data) => {
        if (current()) setApproved(data.status === 'APPROVED')
      })
      .catch(() => {
        if (current()) setApproved(false)
      })
    window.addEventListener('movrit:profile-updated', refresh)
    return () => {
      active = false
      window.removeEventListener('movrit:profile-updated', refresh)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    // 바깥 포인터와 Tab 이동은 닫기만 수행하고 Escape는 버튼으로 초점을 돌립니다.
    const dismissOutside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismissOutside)
    document.addEventListener('focusin', dismissOutside)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      document.removeEventListener('focusin', dismissOutside)
    }
  }, [open])

  return (
    <div
      className="main-home-account"
      ref={root}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOpen(false)
          trigger.current?.focus()
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="main-home-account__trigger"
        aria-expanded={open}
        aria-controls="account-links"
        onClick={() => setOpen(!open)}
      >
        <span className="main-home-header__avatar" aria-hidden="true">
          ☺
        </span>
        <span className="main-home-account__nickname">
          {member?.nickname || '내 계정'}
        </span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <nav
          id="account-links"
          className="main-home-account__dropdown"
          aria-label="계정 이동 메뉴"
        >
          <Link to="/mypage" onClick={() => setOpen(false)}>
            마이페이지 가기
          </Link>
          {member && approved && (
            <Link to="/seller/dashboard" onClick={() => setOpen(false)}>
              브랜드 관리 페이지
            </Link>
          )}
          {member?.role === 'ADMIN' && (
            <Link to="/admin/dashboard" onClick={() => setOpen(false)}>
              관리자 페이지
            </Link>
          )}
          <hr />
          <Link to="/settings" onClick={() => setOpen(false)}>
            설정
          </Link>
          <LogoutButton />
          {failed && <p role="status">계정 정보를 확인하지 못했습니다.</p>}
        </nav>
      )}
    </div>
  )
}
