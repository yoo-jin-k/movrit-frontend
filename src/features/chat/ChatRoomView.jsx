/**
 * 채팅방 하나의 대화 화면입니다.
 * - 처음 열 때 최근 메시지를 받고, 이후 3초마다 '마지막 메시지 다음'만 받아 붙입니다(화면이 가려져 있으면 쉬기).
 * - Enter로 보내고 Shift+Enter로 줄을 바꿉니다. 보내는 중에는 같은 메시지가 두 번 가지 않게 막습니다.
 * - 새 메시지가 오면 아래로 내립니다. 읽음 처리는 서버가 메시지를 내려줄 때 함께 합니다.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  announceChatsChanged,
  readChatMessages,
  sendChatMessage,
} from '../../api/chatApi'
import {
  CHAT_ROLE_LABELS,
  MAX_CHAT_LENGTH,
  chatInputError,
  chatTime,
  mergeMessages,
  roomTypeLabel,
} from './chatModel'

const POLL_MS = 3000

export default function ChatRoomView({ roomId, onActivity, onBack }) {
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const lastId = useRef(0)
  const listRef = useRef(null)

  // 방을 바꾸면 처음부터 다시 받습니다.
  useEffect(() => {
    const controller = new AbortController()
    lastId.current = 0
    readChatMessages(roomId, null, controller.signal)
      .then((data) => {
        setRoom(data)
        setMessages(data.messages || [])
        lastId.current = data.messages?.at(-1)?.id || 0
        setError('')
        announceChatsChanged()
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setRoom(null)
          setError('채팅방을 불러오지 못했습니다. 권한이 없거나 없는 방입니다.')
        }
      })
    return () => controller.abort()
  }, [roomId])

  // 새 메시지 확인: 3초마다 마지막 메시지 다음만 받습니다. 아직 메시지가 없는 방은 전체를 다시 확인합니다(중복은 합칠 때 걸러집니다).
  const poll = useCallback(async () => {
    if (document.visibilityState === 'hidden') return
    try {
      const data = await readChatMessages(roomId, lastId.current || null)
      const incoming = data.messages || []
      if (incoming.length) {
        setMessages((current) => mergeMessages(current, incoming))
        lastId.current = Math.max(lastId.current, incoming.at(-1).id)
        announceChatsChanged()
        onActivity?.()
      }
    } catch {
      // 잠깐의 연결 실패는 다음 확인 때 다시 시도합니다.
    }
  }, [roomId, onActivity])

  useEffect(() => {
    if (!room) return undefined
    const timer = setInterval(poll, POLL_MS)
    return () => clearInterval(timer)
  }, [room, poll])

  // 메시지가 늘어나면 맨 아래로 내립니다.
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages.length])

  const send = async (event) => {
    event?.preventDefault()
    if (sending) return
    const problem = chatInputError(text)
    if (problem) {
      setError(problem)
      return
    }
    setSending(true)
    setError('')
    try {
      const message = await sendChatMessage(roomId, text.trim())
      setMessages((current) => mergeMessages(current, [message]))
      lastId.current = Math.max(lastId.current, message.id)
      setText('')
      onActivity?.()
    } catch (failure) {
      setError(
        failure.response?.data?.detail ||
          '메시지를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setSending(false)
    }
  }

  if (error && !room)
    return (
      <section className="chat-room">
        <p role="alert">{error}</p>
      </section>
    )
  if (!room)
    return (
      <section className="chat-room">
        <p role="status">대화를 불러오고 있습니다.</p>
      </section>
    )

  return (
    <section className="chat-room" aria-label={`${room.title} 대화`}>
      <header className="chat-room__head">
        {onBack && (
          <button type="button" className="chat-back" onClick={onBack}>
            ← 목록
          </button>
        )}
        <div>
          <small>{roomTypeLabel(room.type)}</small>
          <strong>{room.title}</strong>
          <span>{(room.members || []).join(' · ')}</span>
        </div>
      </header>
      <ol className="chat-messages" ref={listRef} aria-live="polite">
        {!messages.length && (
          <li className="chat-empty">
            아직 대화가 없습니다. 첫 메시지를 보내 보세요.
          </li>
        )}
        {messages.map((message) => (
          <li
            key={message.id}
            className={`chat-message ${message.mine ? 'is-mine' : ''} is-${String(message.senderRole).toLowerCase()}`}
          >
            {!message.mine && (
              <span className="chat-message__who">
                <em>{CHAT_ROLE_LABELS[message.senderRole]}</em>{' '}
                {message.senderName}
              </span>
            )}
            <p>{message.body}</p>
            <time dateTime={message.createdAt}>
              {chatTime(message.createdAt)}
            </time>
          </li>
        ))}
      </ol>
      <form className="chat-input" onSubmit={send}>
        <label className="chat-sr" htmlFor={`chat-input-${roomId}`}>
          메시지 입력
        </label>
        <textarea
          id={`chat-input-${roomId}`}
          rows={2}
          maxLength={MAX_CHAT_LENGTH}
          value={text}
          placeholder="메시지를 입력하세요. (Enter 보내기, Shift+Enter 줄바꿈)"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            )
              send(event)
          }}
        />
        <button type="submit" disabled={sending || !text.trim()}>
          {sending ? '보내는 중…' : '보내기'}
        </button>
      </form>
      {error && (
        <p className="chat-error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
