/**
 * 채팅 목록 + 대화 화면입니다. 참여자(/messages)·브랜드(/seller/messages)·운영자(/admin/messages)가 함께 씁니다.
 * - 왼쪽 목록에서 방을 고르면 오른쪽에 대화가 열립니다(좁은 화면에서는 목록과 대화를 번갈아 보여줍니다).
 * - 주소의 ?room= 으로 특정 방을 바로 열 수 있습니다(신청 상세의 '채팅' 버튼이 이 주소로 보냅니다).
 * - 목록은 실시간 이벤트(새 메시지)를 받을 때, 15초마다, 그리고 대화에 새 메시지가 오갈 때 다시 불러와 안 읽은 수와 최근 메시지를 갱신합니다.
 * - 참여자·브랜드는 '운영자에게 문의'로 1:1 문의방을 열 수 있습니다.
 */
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { openSupportChat, readChatRooms } from '../../api/chatApi'
import ChatRoomView from './ChatRoomView'
import { CHAT_EVENT, acquireChatStream } from './chatStream'
import { chatTime, roomTypeLabel } from './chatModel'
import './chat.css'

const LIST_REFRESH_MS = 15000

export default function ChatInbox({ allowSupport = true, emptyHint }) {
  const [params, setParams] = useSearchParams()
  const selected = Number(params.get('room')) || null
  const [rooms, setRooms] = useState(null)
  const [error, setError] = useState('')
  const [opening, setOpening] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const refresh = useCallback(() => setAttempt((value) => value + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    readChatRooms(controller.signal)
      .then((data) => {
        setRooms(data)
        setError('')
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError('채팅 목록을 불러오지 못했습니다.')
      })
    return () => controller.abort()
  }, [attempt])

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState !== 'hidden') refresh()
    }, LIST_REFRESH_MS)
    // 새 메시지 이벤트가 오면 목록(안 읽은 수·최근 메시지)을 바로 다시 불러옵니다.
    const onEvent = (event) => {
      if (event.detail?.type === 'message') refresh()
    }
    window.addEventListener(CHAT_EVENT, onEvent)
    // 이 화면을 보는 동안 실시간 이벤트 연결을 열어 둡니다(운영자 화면처럼 헤더 배지가 없는 곳 포함).
    const release = acquireChatStream()
    return () => {
      clearInterval(timer)
      window.removeEventListener(CHAT_EVENT, onEvent)
      release()
    }
  }, [refresh])

  const select = (id) => setParams(id ? { room: String(id) } : {})

  // 운영자 문의방을 열고(없으면 만들고) 바로 대화를 보여줍니다.
  const openSupport = async () => {
    setOpening(true)
    setError('')
    try {
      const room = await openSupportChat()
      select(room.id)
      refresh()
    } catch (failure) {
      setError(
        failure.response?.data?.detail || '운영자 문의방을 열지 못했습니다.',
      )
    } finally {
      setOpening(false)
    }
  }

  return (
    <div className={`chat-inbox ${selected ? 'has-room' : ''}`}>
      <aside className="chat-list" aria-label="채팅 목록">
        <div className="chat-list__head">
          <strong>대화 목록</strong>
          {allowSupport && (
            <button type="button" onClick={openSupport} disabled={opening}>
              {opening ? '여는 중…' : '운영자에게 문의'}
            </button>
          )}
        </div>
        {error && <p role="alert">{error}</p>}
        {!rooms && !error && <p role="status">목록을 불러오고 있습니다.</p>}
        {rooms && !rooms.length && (
          <p className="chat-list__empty">
            {emptyHint || '아직 대화가 없습니다.'}
          </p>
        )}
        <ul>
          {(rooms || []).map((room) => (
            <li key={room.id}>
              <button
                type="button"
                aria-current={room.id === selected ? 'true' : undefined}
                onClick={() => select(room.id)}
              >
                <span className="chat-list__top">
                  <small>{roomTypeLabel(room.type)}</small>
                  <time>{chatTime(room.lastMessageAt)}</time>
                </span>
                <strong>{room.title}</strong>
                <span className="chat-list__who">{room.subtitle}</span>
                <span className="chat-list__preview">
                  {room.lastMessage || '아직 메시지가 없습니다.'}
                </span>
                {room.unreadCount > 0 && (
                  <em
                    className="chat-badge"
                    aria-label={`안 읽은 메시지 ${room.unreadCount}개`}
                  >
                    {room.unreadCount > 99 ? '99+' : room.unreadCount}
                  </em>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className="chat-pane">
        {selected ? (
          <ChatRoomView
            key={selected}
            roomId={selected}
            onActivity={refresh}
            onBack={() => select(null)}
          />
        ) : (
          <p className="chat-pane__empty">
            왼쪽 목록에서 대화를 선택해 주세요.
          </p>
        )}
      </div>
    </div>
  )
}
