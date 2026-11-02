/**
 * 채팅방 하나의 대화 화면입니다.
 * - 처음 열 때 최근 50개를 받고, '이전 메시지 더 보기'로 50개씩 더 불러옵니다.
 * - 실시간 이벤트(새 메시지·읽음)를 받으면 바로 '마지막 메시지 다음'을 가져옵니다. 이벤트 연결이 끊겨도 주기적으로 확인합니다
 *   (연결 중 15초, 끊김 3초).
 * - 내 메시지 아래에 상대가 읽었으면 '읽음'을 표시합니다.
 * - 사진(JPG·PNG)·PDF를 첨부할 수 있습니다. 사진은 말풍선 안에 보여주고, PDF는 받기 버튼으로 엽니다.
 * - Enter로 보내고 Shift+Enter로 줄을 바꿉니다. 보내는 중에는 같은 메시지가 두 번 가지 않게 막습니다.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  announceChatsChanged,
  readChatAttachment,
  readChatMessages,
  readOlderChatMessages,
  sendChatAttachment,
  sendChatMessage,
} from '../../api/chatApi'
import {
  CHAT_ROLE_LABELS,
  MAX_CHAT_LENGTH,
  chatAttachmentError,
  chatInputError,
  chatTime,
  fileSizeLabel,
  isReadByOthers,
  mergeMessages,
  roomTypeLabel,
} from './chatModel'
import { CHAT_EVENT, isChatStreamConnected } from './chatStream'

const POLL_FAST_MS = 3000
const POLL_SLOW_MS = 15000

// 첨부 사진·PDF를 로그인 요청으로 받아 임시 주소로 보여줍니다. 사진은 화면에 들어올 때 받고, PDF는 누를 때 받습니다.
function AttachmentView({ roomId, message }) {
  const { attachment } = message
  const [url, setUrl] = useState('')
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!attachment.image) return undefined
    const controller = new AbortController()
    let objectUrl = ''
    readChatAttachment(roomId, message.id, controller.signal)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true)
      })
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [roomId, message.id, attachment.image])

  const download = async () => {
    try {
      const blob = await readChatAttachment(roomId, message.id)
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = attachment.name
      link.click()
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000)
    } catch {
      setFailed(true)
    }
  }

  if (attachment.image)
    return failed ? (
      <span className="chat-attachment__error">
        사진을 불러오지 못했습니다.
      </span>
    ) : url ? (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img
          className="chat-attachment__image"
          src={url}
          alt={attachment.name}
        />
      </a>
    ) : (
      <span className="chat-attachment__loading">사진을 불러오는 중…</span>
    )
  return (
    <button type="button" className="chat-attachment__file" onClick={download}>
      📎 {attachment.name} <small>{fileSizeLabel(attachment.size)}</small>
      {failed && <em> · 받지 못했습니다</em>}
    </button>
  )
}

export default function ChatRoomView({ roomId, onActivity, onBack }) {
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [othersRead, setOthersRead] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [sending, setSending] = useState(false)
  const lastId = useRef(0)
  const listRef = useRef(null)
  const fileRef = useRef(null)
  const keepScroll = useRef(false)

  // 방을 바꾸면 처음부터 다시 받습니다.
  useEffect(() => {
    const controller = new AbortController()
    lastId.current = 0
    readChatMessages(roomId, null, controller.signal)
      .then((data) => {
        setRoom(data)
        setMessages(data.messages || [])
        setOthersRead(data.othersLastReadId || 0)
        setHasMore(Boolean(data.hasMore))
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

  // 새 메시지 확인: 마지막 메시지 다음만 받습니다. 상대의 읽음 위치도 함께 갱신합니다.
  const poll = useCallback(async () => {
    if (document.visibilityState === 'hidden') return
    try {
      const data = await readChatMessages(roomId, lastId.current || null)
      setOthersRead(data.othersLastReadId || 0)
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

  // 실시간 이벤트: 이 방의 새 메시지·읽음 변화가 오면 바로 확인합니다.
  useEffect(() => {
    if (!room) return undefined
    const onEvent = (event) => {
      const { type, data } = event.detail || {}
      if (
        (type === 'message' || type === 'read') &&
        Number(data?.roomId) === Number(roomId)
      )
        poll()
      if (type === 'connected') poll()
    }
    window.addEventListener(CHAT_EVENT, onEvent)
    // 이벤트 연결이 있으면 15초(3초 × 5번째마다), 없으면 3초마다 확인합니다.
    let tick = 0
    const timer = setInterval(() => {
      tick += 1
      if (
        !isChatStreamConnected() ||
        tick % (POLL_SLOW_MS / POLL_FAST_MS) === 0
      )
        poll()
    }, POLL_FAST_MS)
    return () => {
      window.removeEventListener(CHAT_EVENT, onEvent)
      clearInterval(timer)
    }
  }, [room, roomId, poll])

  // 새 메시지가 붙으면 맨 아래로 내립니다(이전 메시지를 불러올 때는 보던 위치를 유지합니다).
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    if (keepScroll.current) {
      list.scrollTop = list.scrollHeight - keepScroll.current
      keepScroll.current = false
    } else list.scrollTop = list.scrollHeight
  }, [messages])

  const loadOlder = async () => {
    if (loadingOlder || !messages.length) return
    setLoadingOlder(true)
    try {
      const data = await readOlderChatMessages(roomId, messages[0].id)
      keepScroll.current = listRef.current
        ? listRef.current.scrollHeight - listRef.current.scrollTop
        : false
      setMessages((current) => mergeMessages(data.messages || [], current))
      setHasMore(Boolean(data.hasMore))
    } catch {
      setError('이전 메시지를 불러오지 못했습니다.')
    } finally {
      setLoadingOlder(false)
    }
  }

  const send = async (event) => {
    event?.preventDefault()
    if (sending) return
    const problem = file ? chatAttachmentError(file) : chatInputError(text)
    if (problem) {
      setError(problem)
      return
    }
    setSending(true)
    setError('')
    try {
      const message = file
        ? await sendChatAttachment(roomId, file, text.trim())
        : await sendChatMessage(roomId, text.trim())
      setMessages((current) => mergeMessages(current, [message]))
      lastId.current = Math.max(lastId.current, message.id)
      setText('')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
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
          <span>{(room.members || []).join(' / ')}</span>
        </div>
      </header>
      <ol className="chat-messages" ref={listRef} aria-live="polite">
        {hasMore && (
          <li className="chat-more">
            <button type="button" onClick={loadOlder} disabled={loadingOlder}>
              {loadingOlder ? '불러오는 중…' : '이전 메시지 더 보기'}
            </button>
          </li>
        )}
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
            {message.attachment && (
              <div className="chat-attachment">
                <AttachmentView roomId={roomId} message={message} />
              </div>
            )}
            {message.body && <p>{message.body}</p>}
            <time dateTime={message.createdAt}>
              {isReadByOthers(message, othersRead) && (
                <span className="chat-read">읽음 · </span>
              )}
              {chatTime(message.createdAt)}
            </time>
          </li>
        ))}
      </ol>
      <form className="chat-input" onSubmit={send}>
        <label className="chat-attach" title="사진·PDF 첨부">
          <span aria-hidden="true">＋</span>
          <span className="chat-sr">사진 또는 PDF 첨부</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(event) => {
              const picked = event.target.files?.[0] || null
              const problem = picked ? chatAttachmentError(picked) : ''
              setError(problem)
              setFile(problem ? null : picked)
              if (problem) event.target.value = ''
            }}
          />
        </label>
        <div className="chat-input__body">
          {file && (
            <span className="chat-input__file">
              📎 {file.name} ({fileSizeLabel(file.size)})
              <button
                type="button"
                aria-label="첨부 취소"
                onClick={() => {
                  setFile(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
              >
                ×
              </button>
            </span>
          )}
          <label className="chat-sr" htmlFor={`chat-input-${roomId}`}>
            메시지 입력
          </label>
          <textarea
            id={`chat-input-${roomId}`}
            rows={2}
            maxLength={MAX_CHAT_LENGTH}
            value={text}
            placeholder={
              file
                ? '사진·파일과 함께 보낼 말(선택)'
                : '메시지를 입력하세요. (Enter 보내기, Shift+Enter 줄바꿈)'
            }
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
        </div>
        <button type="submit" disabled={sending || (!text.trim() && !file)}>
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
