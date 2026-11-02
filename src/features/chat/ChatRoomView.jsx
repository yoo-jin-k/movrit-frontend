/**
 * 채팅방 하나의 대화 화면입니다.
 * - 처음 열 때 최근 50개를 받고, '이전 메시지 더 보기'로 50개씩 더 불러옵니다.
 * - 실시간 이벤트(새 메시지·읽음·입력 중)를 받으면 바로 반영합니다. 이벤트 연결이 끊겨도 주기적으로 확인합니다
 *   (연결 중 15초, 끊김 3초).
 * - 내 메시지 아래에 상대가 읽었으면 '읽음'을 표시하고, 상대가 글을 쓰는 중이면 '○○님이 입력 중…'을 보여줍니다.
 * - 사진(JPG·PNG)·PDF·영상(MP4·MOV·WebM)을 한 번에 10개까지 첨부할 수 있습니다. 파일마다 메시지 하나로 보내고,
 *   함께 쓴 글은 첫 파일에 붙입니다. 사진은 말풍선 안에, 영상은 '재생'을 누르면 불러와 재생하고, PDF는 받기 버튼으로 엽니다.
 * - 머리글의 '검색'으로 방 안 메시지를 찾고, 결과를 누르면 그 메시지 위치로 이동합니다('최신 메시지로'로 돌아옵니다).
 * - Enter로 보내고 Shift+Enter로 줄을 바꿉니다. 보내는 중에는 같은 메시지가 두 번 가지 않게 막습니다.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  announceChatsChanged,
  readChatAttachment,
  readChatMessages,
  readOlderChatMessages,
  searchChatMessages,
  sendChatAttachment,
  sendChatMessage,
  sendChatTyping,
} from '../../api/chatApi'
import {
  CHAT_ATTACHMENT_TYPES,
  CHAT_ROLE_LABELS,
  MAX_CHAT_LENGTH,
  TYPING_SEND_MS,
  TYPING_SHOW_MS,
  chatFilesError,
  chatInputError,
  chatSearchError,
  chatTime,
  fileSizeLabel,
  highlightParts,
  isReadByOthers,
  isVideoAttachment,
  mergeMessages,
  roomTypeLabel,
  typingLabel,
} from './chatModel'
import { CHAT_EVENT, isChatStreamConnected } from './chatStream'

const POLL_FAST_MS = 3000
const POLL_SLOW_MS = 15000

// 첨부 파일을 받아 저장 창을 엽니다(PDF 등).
async function saveAttachment(roomId, message) {
  const blob = await readChatAttachment(roomId, message.id)
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = message.attachment.name
  link.click()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10000)
}

// 첨부 사진을 로그인 요청으로 받아 임시 주소로 보여줍니다. 화면에 그려질 때 받습니다.
function ImageAttachment({ roomId, message }) {
  const [url, setUrl] = useState('')
  const [failed, setFailed] = useState(false)
  useEffect(() => {
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
  }, [roomId, message.id])
  if (failed)
    return (
      <span className="chat-attachment__error">
        사진을 불러오지 못했습니다.
      </span>
    )
  if (!url)
    return <span className="chat-attachment__loading">사진을 불러오는 중…</span>
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img
        className="chat-attachment__image"
        src={url}
        alt={message.attachment.name}
      />
    </a>
  )
}

// 첨부 영상은 크기가 커서 '재생'을 누를 때만 받아 옵니다. 받은 뒤에는 화면 안에서 재생합니다.
function VideoAttachment({ roomId, message }) {
  const { attachment } = message
  const [url, setUrl] = useState('')
  const [state, setState] = useState('idle')
  useEffect(() => () => url && URL.revokeObjectURL(url), [url])
  const play = async () => {
    setState('loading')
    try {
      const blob = await readChatAttachment(roomId, message.id)
      setUrl(URL.createObjectURL(blob))
      setState('ready')
    } catch {
      setState('failed')
    }
  }
  if (state === 'ready')
    return (
      <video
        className="chat-attachment__video"
        src={url}
        controls
        autoPlay
        playsInline
        aria-label={attachment.name}
      />
    )
  return (
    <button
      type="button"
      className="chat-attachment__file chat-attachment__play"
      onClick={play}
      disabled={state === 'loading'}
    >
      ▶ {state === 'loading' ? '영상을 불러오는 중…' : attachment.name}{' '}
      <small>{fileSizeLabel(attachment.size)}</small>
      {state === 'failed' && <em> · 불러오지 못했습니다</em>}
    </button>
  )
}

// PDF처럼 화면에 바로 보여주지 않는 첨부는 받기 버튼으로 엽니다.
function FileAttachment({ roomId, message }) {
  const [failed, setFailed] = useState(false)
  return (
    <button
      type="button"
      className="chat-attachment__file"
      onClick={() =>
        saveAttachment(roomId, message).catch(() => setFailed(true))
      }
    >
      📎 {message.attachment.name}{' '}
      <small>{fileSizeLabel(message.attachment.size)}</small>
      {failed && <em> · 받지 못했습니다</em>}
    </button>
  )
}

function AttachmentView({ roomId, message }) {
  if (message.attachment.image)
    return <ImageAttachment roomId={roomId} message={message} />
  if (isVideoAttachment(message.attachment))
    return <VideoAttachment roomId={roomId} message={message} />
  return <FileAttachment roomId={roomId} message={message} />
}

// 검색 결과의 일치 부분을 강조해 보여줍니다.
function Highlighted({ text, query }) {
  return highlightParts(text, query).map((part, index) =>
    part.match ? <mark key={index}>{part.text}</mark> : part.text,
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
  const [files, setFiles] = useState([])
  const [sending, setSending] = useState(false)
  // 입력 중인 다른 사람: { memberId: 이름 }
  const [typers, setTypers] = useState({})
  // 검색: 열림 여부·검색어·결과(null이면 아직 검색 전)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  // 검색 결과로 이동해 과거 위치를 보고 있으면 true입니다. 이때는 새 메시지를 끝에 붙이지 않고 '최신 메시지로' 버튼에 표시만 합니다.
  const [jumped, setJumped] = useState(false)
  const [newWhileJumped, setNewWhileJumped] = useState(false)
  const [focusId, setFocusId] = useState(null)
  const lastId = useRef(0)
  const listRef = useRef(null)
  const fileRef = useRef(null)
  const keepScroll = useRef(false)
  const lastTypingSent = useRef(0)
  const typerTimers = useRef({})
  const jumpedRef = useRef(false)

  // 받은 최근 50개로 대화를 처음 상태로 맞춥니다(처음 열 때, '최신 메시지로'를 누를 때).
  const applyLatest = useCallback((data) => {
    setRoom(data)
    setMessages(data.messages || [])
    setOthersRead(data.othersLastReadId || 0)
    setHasMore(Boolean(data.hasMore))
    lastId.current = data.messages?.at(-1)?.id || 0
    jumpedRef.current = false
    setJumped(false)
    setNewWhileJumped(false)
    setFocusId(null)
    setError('')
    announceChatsChanged()
  }, [])

  const loadLatest = useCallback(
    async () => applyLatest(await readChatMessages(roomId, null)),
    [roomId, applyLatest],
  )

  // 방을 바꾸면 처음부터 다시 받습니다.
  useEffect(() => {
    const controller = new AbortController()
    lastId.current = 0
    readChatMessages(roomId, null, controller.signal)
      .then(applyLatest)
      .catch(() => {
        if (!controller.signal.aborted) {
          setRoom(null)
          setError('채팅방을 불러오지 못했습니다. 권한이 없거나 없는 방입니다.')
        }
      })
    return () => controller.abort()
  }, [roomId, applyLatest])

  // 입력 중 표시를 지웁니다(5초 경과).
  const dropTyper = useCallback((memberId) => {
    clearTimeout(typerTimers.current[memberId])
    delete typerTimers.current[memberId]
    setTypers((current) => {
      if (!(memberId in current)) return current
      const next = { ...current }
      delete next[memberId]
      return next
    })
  }, [])

  // 방을 떠나면 남은 입력 중 타이머를 정리합니다.
  useEffect(() => {
    const timers = typerTimers.current
    return () => Object.values(timers).forEach(clearTimeout)
  }, [roomId])

  // 새 메시지 확인: 마지막 메시지 다음만 받습니다. 상대의 읽음 위치도 함께 갱신합니다.
  const poll = useCallback(async () => {
    if (document.visibilityState === 'hidden') return
    // 과거 위치를 보고 있을 때는 새 메시지를 받아 오지 않고(읽음 처리도 하지 않음) 버튼에 표시만 합니다.
    if (jumpedRef.current) {
      setNewWhileJumped(true)
      return
    }
    try {
      const data = await readChatMessages(roomId, lastId.current || null)
      setOthersRead(data.othersLastReadId || 0)
      const incoming = data.messages || []
      if (incoming.length) {
        setMessages((current) => mergeMessages(current, incoming))
        lastId.current = Math.max(lastId.current, incoming.at(-1).id)
        // 메시지를 보낸 사람의 '입력 중' 표시는 바로 지웁니다.
        const senders = new Set(
          incoming.filter((m) => !m.mine).map((m) => m.senderName),
        )
        setTypers((current) => {
          const next = { ...current }
          let changed = false
          Object.entries(current).forEach(([id, name]) => {
            if (senders.has(name)) {
              clearTimeout(typerTimers.current[id])
              delete next[id]
              changed = true
            }
          })
          return changed ? next : current
        })
        announceChatsChanged()
        onActivity?.()
      }
    } catch {
      // 잠깐의 연결 실패는 다음 확인 때 다시 시도합니다.
    }
  }, [roomId, onActivity])

  // 실시간 이벤트: 이 방의 새 메시지·읽음 변화가 오면 바로 확인하고, '입력 중'은 5초 동안 보여줍니다.
  useEffect(() => {
    if (!room) return undefined
    const onEvent = (event) => {
      const { type, data } = event.detail || {}
      const sameRoom = Number(data?.roomId) === Number(roomId)
      if ((type === 'message' || type === 'read') && sameRoom) poll()
      if (type === 'typing' && sameRoom && data?.memberId != null) {
        const id = String(data.memberId)
        setTypers((current) =>
          current[id] === data.name ? current : { ...current, [id]: data.name },
        )
        clearTimeout(typerTimers.current[id])
        typerTimers.current[id] = setTimeout(
          () => dropTyper(id),
          TYPING_SHOW_MS,
        )
      }
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
  }, [room, roomId, poll, dropTyper])

  // 메시지 목록이 바뀌면 스크롤 위치를 맞춥니다.
  // - 검색 결과로 이동했으면 그 메시지를 가운데로 보여줍니다.
  // - 이전 메시지를 불러왔으면 보던 위치를 유지합니다.
  // - 그 밖에는 맨 아래(최신)로 내립니다.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    if (focusId) {
      list
        .querySelector(`[data-message-id="${focusId}"]`)
        ?.scrollIntoView?.({ block: 'center' })
    } else if (keepScroll.current) {
      list.scrollTop = list.scrollHeight - keepScroll.current
      keepScroll.current = false
    } else list.scrollTop = list.scrollHeight
  }, [messages, focusId])

  const loadOlder = async () => {
    if (loadingOlder || !messages.length) return
    setLoadingOlder(true)
    try {
      const data = await readOlderChatMessages(roomId, messages[0].id)
      keepScroll.current = listRef.current
        ? listRef.current.scrollHeight - listRef.current.scrollTop
        : false
      setFocusId(null)
      setMessages((current) => mergeMessages(data.messages || [], current))
      setHasMore(Boolean(data.hasMore))
    } catch {
      setError('이전 메시지를 불러오지 못했습니다.')
    } finally {
      setLoadingOlder(false)
    }
  }

  const runSearch = async (event) => {
    event?.preventDefault()
    const problem = chatSearchError(query)
    if (problem) {
      setError(problem)
      return
    }
    setSearching(true)
    setError('')
    try {
      setResults(await searchChatMessages(roomId, query.trim()))
    } catch (failure) {
      setError(
        failure.response?.data?.detail ||
          '검색하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setSearching(false)
    }
  }

  // 검색 결과를 누르면 그 메시지까지(그 메시지 포함 이전 50개)를 불러와 그 위치를 보여줍니다.
  const jumpTo = async (messageId) => {
    try {
      const data = await readOlderChatMessages(roomId, messageId + 1)
      const page = data.messages || []
      const latestShown = page.at(-1)?.id || 0
      // 결과가 이미 지금 보이는 최신 메시지까지 닿아 있으면 과거 위치 모드로 바꾸지 않습니다.
      const behind = latestShown < lastId.current
      jumpedRef.current = behind
      setJumped(behind)
      setNewWhileJumped(false)
      setMessages((current) => (behind ? page : mergeMessages(page, current)))
      setHasMore(Boolean(data.hasMore))
      setFocusId(messageId)
      setSearchOpen(false)
    } catch {
      setError('메시지 위치를 불러오지 못했습니다.')
    }
  }

  // 글을 입력하는 동안 3초에 한 번만 '입력 중' 신호를 보냅니다.
  const announceTyping = () => {
    const now = Date.now()
    if (now - lastTypingSent.current < TYPING_SEND_MS) return
    lastTypingSent.current = now
    sendChatTyping(roomId).catch(() => {})
  }

  const clearFiles = () => {
    setFiles([])
    if (fileRef.current) fileRef.current.value = ''
  }

  const send = async (event) => {
    event?.preventDefault()
    if (sending) return
    const problem = files.length ? chatFilesError(files) : chatInputError(text)
    if (problem) {
      setError(problem)
      return
    }
    setSending(true)
    setError('')
    // 과거 위치를 보고 있었다면 최신 위치로 돌아온 뒤 보내야 내 메시지가 대화 끝에 이어 붙습니다.
    if (jumpedRef.current) await loadLatest().catch(() => {})
    const body = text.trim()
    let sent = 0
    try {
      if (files.length) {
        // 파일마다 메시지 하나로 차례대로 보내고, 글은 첫 파일에만 붙입니다.
        for (const file of files) {
          const message = await sendChatAttachment(
            roomId,
            file,
            sent === 0 ? body : '',
          )
          sent += 1
          setMessages((current) => mergeMessages(current, [message]))
          lastId.current = Math.max(lastId.current, message.id)
        }
      } else {
        const message = await sendChatMessage(roomId, body)
        setMessages((current) => mergeMessages(current, [message]))
        lastId.current = Math.max(lastId.current, message.id)
      }
      setText('')
      clearFiles()
      lastTypingSent.current = 0
      onActivity?.()
    } catch (failure) {
      const detail =
        failure.response?.data?.detail ||
        '메시지를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.'
      if (sent > 0) {
        // 일부만 보냈으면 보낸 파일은 목록에서 빼고, 글도 이미 보냈으므로 지웁니다.
        setFiles((current) => current.slice(sent))
        setText('')
        setError(`${sent}개를 보냈고 나머지는 보내지 못했습니다. ${detail}`)
      } else setError(detail)
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

  const typing = typingLabel(Object.values(typers))

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
        <button
          type="button"
          className="chat-search-toggle"
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen((open) => !open)}
        >
          {searchOpen ? '검색 닫기' : '대화 검색'}
        </button>
      </header>
      {searchOpen && (
        <div className="chat-search">
          <form onSubmit={runSearch} role="search">
            <label className="chat-sr" htmlFor={`chat-search-${roomId}`}>
              대화 검색어
            </label>
            <input
              id={`chat-search-${roomId}`}
              type="search"
              maxLength={50}
              value={query}
              placeholder="메시지·파일 이름 검색"
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" disabled={searching}>
              {searching ? '찾는 중…' : '찾기'}
            </button>
          </form>
          {results && (
            <ul className="chat-search__results" aria-label="검색 결과">
              {!results.length && (
                <li className="chat-search__empty">검색 결과가 없습니다.</li>
              )}
              {results.map((message) => (
                <li key={message.id}>
                  <button type="button" onClick={() => jumpTo(message.id)}>
                    <span>
                      {message.mine ? '나' : message.senderName} ·{' '}
                      {chatTime(message.createdAt)}
                    </span>
                    <p>
                      <Highlighted
                        text={message.body || message.attachment?.name || ''}
                        query={query}
                      />
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
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
            data-message-id={message.id}
            className={`chat-message ${message.mine ? 'is-mine' : ''} is-${String(message.senderRole).toLowerCase()} ${focusId === message.id ? 'is-focused' : ''}`}
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
      {jumped && (
        <button
          type="button"
          className="chat-latest"
          onClick={() =>
            loadLatest().catch(() =>
              setError('최신 메시지를 불러오지 못했습니다.'),
            )
          }
        >
          {newWhileJumped ? '새 메시지 · 최신 메시지로 ↓' : '최신 메시지로 ↓'}
        </button>
      )}
      <p className="chat-typing" aria-live="polite">
        {typing && (
          <>
            {typing}
            <span className="chat-typing__dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </>
        )}
      </p>
      <form className="chat-input" onSubmit={send}>
        <label className="chat-attach" title="사진·영상·PDF 첨부">
          <span aria-hidden="true">＋</span>
          <span className="chat-sr">사진·영상·PDF 첨부(최대 10개)</span>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={CHAT_ATTACHMENT_TYPES.join(',')}
            onChange={(event) => {
              // 이미 고른 파일에 이어 붙이고, 맞지 않는 파일이 있으면 이번에 고른 것은 받지 않습니다.
              const picked = [...files, ...Array.from(event.target.files || [])]
              const problem = chatFilesError(picked)
              setError(problem)
              if (!problem) setFiles(picked)
              event.target.value = ''
            }}
          />
        </label>
        <div className="chat-input__body">
          {files.length > 0 && (
            <ul className="chat-input__files" aria-label="보낼 파일">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`} className="chat-input__file">
                  {file.type.startsWith('video/')
                    ? '🎬'
                    : file.type.startsWith('image/')
                      ? '🖼'
                      : '📎'}{' '}
                  {file.name} ({fileSizeLabel(file.size)})
                  <button
                    type="button"
                    aria-label={`${file.name} 첨부 취소`}
                    onClick={() =>
                      setFiles((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
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
              files.length
                ? '파일과 함께 보낼 말(선택, 첫 파일에 붙습니다)'
                : '메시지를 입력하세요. (Enter 보내기, Shift+Enter 줄바꿈)'
            }
            onChange={(event) => {
              setText(event.target.value)
              if (event.target.value.trim()) announceTyping()
            }}
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
        <button
          type="submit"
          disabled={sending || (!text.trim() && !files.length)}
        >
          {sending
            ? '보내는 중…'
            : files.length > 1
              ? `${files.length}개 보내기`
              : '보내기'}
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
