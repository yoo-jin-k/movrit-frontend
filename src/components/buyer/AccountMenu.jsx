/**
 * 서버 회원 정보와 업체 승인 상태를 읽어 계정별 이동 링크를 표시합니다.
 * 실명이나 채널 별칭은 닉네임의 대체값으로 노출하지 않으며 메뉴가 권한을 부여하지 않습니다.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import MemberAvatar from '../../features/membership/MemberAvatar'
import AccountActivity from '../../features/membership/AccountActivity'
import '../../features/membership/accountProfile.css'
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
        <MemberAvatar member={member} size={28} />
        <span className="main-home-account__nickname">
          {member?.nickname || '내 계정'}
        </span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <nav
          id="account-links"
          className="main-home-account__dropdown account-card"
          aria-label="계정 이동 메뉴"
        >
          <div className="account-card-profile">
            <div className="account-card-avatar">
              <MemberAvatar member={member} />
              <Link
                className="account-camera"
                to="/settings#profile-photo"
                aria-label="프로필 사진 변경"
                onClick={() => setOpen(false)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5h8l2 3h3v12H3V8h3z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </Link>
            </div>
            <div>
              <strong>안녕하세요.</strong>
              <Link to="/mypage/profile" onClick={() => setOpen(false)}>
                {member?.nickname || '내 계정'}님 <span>›</span>
              </Link>
            </div>
          </div>
          <AccountActivity onClose={() => setOpen(false)} />
          <hr />
          <div className="account-card-footer">
            <Link to="/mypage" onClick={() => setOpen(false)}>
              마이페이지
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
            <Link to="/settings" onClick={() => setOpen(false)}>
              설정
            </Link>
            <LogoutButton />
          </div>
          {failed && <p role="status">계정 정보를 확인하지 못했습니다.</p>}
        </nav>
      )}
    </div>
  )
}
