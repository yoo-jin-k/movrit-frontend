/**
 * 캠페인 찜(하트) 버튼입니다. 캠페인 카드와 상세 화면이 함께 씁니다.
 *
 * - 실제 캠페인: 서버에 저장된 뒤에만 채워진 하트로 바뀝니다(가짜 성공 표시 없음).
 *   로그인하지 않았으면 로그인 화면으로 보내고, 저장에 실패하면 상태를 그대로 두고 다시 누르도록 안내합니다.
 * - 개발 미리보기 캠페인: 서버를 부르지 않고 이 탭의 세션 상태만 바꿉니다.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  toggleCampaignFavorite,
  useCampaignFavorite,
} from './campaignFavoriteStore'
import { usePreviewFavorite } from './usePreviewFavorite'

/** 하트 아이콘입니다. 찜한 상태면 포인트 색으로 채웁니다. */
export function HeartIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// 실제 캠페인 찜입니다. 서버 응답으로만 상태가 바뀝니다.
function LiveFavoriteButton({ campaignId, title, className }) {
  const navigate = useNavigate()
  const { loggedIn, saved, busy } = useCampaignFavorite(campaignId)
  const [failed, setFailed] = useState(false)
  const toggle = async () => {
    if (!loggedIn) {
      navigate('/login')
      return
    }
    setFailed(false)
    try {
      await toggleCampaignFavorite(campaignId)
    } catch {
      setFailed(true)
    }
  }
  return (
    <button
      className={`${className}${saved ? ' is-saved' : ''}`}
      type="button"
      aria-label={
        failed
          ? `${title} 찜 저장 실패, 다시 시도`
          : `${title} ${saved ? '찜 해제' : '찜하기'}`
      }
      title={failed ? '찜 저장에 실패했습니다. 다시 눌러 주세요.' : undefined}
      aria-pressed={saved}
      disabled={busy}
      onClick={toggle}
    >
      <HeartIcon filled={saved} />
    </button>
  )
}

// 개발 미리보기 캠페인 찜입니다. 세션 저장소만 바꿉니다.
function PreviewFavoriteButton({ campaignId, title, className }) {
  const [saved, toggleSaved] = usePreviewFavorite(campaignId)
  return (
    <button
      className={`${className}${saved ? ' is-saved' : ''}`}
      type="button"
      aria-label={`${title} 미리보기 찜`}
      aria-pressed={saved}
      onClick={toggleSaved}
    >
      <HeartIcon filled={saved} />
    </button>
  )
}

/**
 * @param {string} campaignId 캠페인 ID
 * @param {string} title 화면 읽기에 쓸 캠페인 제목
 * @param {boolean} preview 개발 미리보기 캠페인 여부
 * @param {string} className 위치·크기를 정하는 클래스(카드·상세가 다름)
 */
export default function FavoriteButton({
  campaignId,
  title,
  preview = false,
  className = 'favorite-button',
}) {
  return preview ? (
    <PreviewFavoriteButton
      campaignId={campaignId}
      title={title}
      className={className}
    />
  ) : (
    <LiveFavoriteButton
      campaignId={campaignId}
      title={title}
      className={className}
    />
  )
}
