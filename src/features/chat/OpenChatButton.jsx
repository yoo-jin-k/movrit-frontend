/**
 * 신청 한 건의 대화방(참여자 ↔ 브랜드, 운영자 참여 가능)을 열고 채팅 화면으로 이동하는 버튼입니다.
 * basePath는 화면마다 다릅니다(참여자 /messages, 브랜드 /seller/messages, 운영자 /admin/messages).
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { openApplicationChat } from '../../api/chatApi'

export default function OpenChatButton({
  applicationId,
  basePath,
  label = '채팅하기',
  className,
}) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const open = async () => {
    setBusy(true)
    setError('')
    try {
      const room = await openApplicationChat(applicationId)
      navigate(`${basePath}?room=${room.id}`)
    } catch (failure) {
      setBusy(false)
      setError(failure.response?.data?.detail || '채팅방을 열지 못했습니다.')
    }
  }
  return (
    <>
      <button
        type="button"
        className={className}
        onClick={open}
        disabled={busy}
      >
        {busy ? '여는 중…' : label}
      </button>
      {error && <span role="alert">{error}</span>}
    </>
  )
}
