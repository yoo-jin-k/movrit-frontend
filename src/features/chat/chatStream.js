/**
 * 채팅 실시간 이벤트(SSE) 연결입니다. 화면 전체에서 연결 하나만 열어 둡니다.
 * - 브라우저 EventSource는 로그인 토큰 헤더를 붙일 수 없어서, fetch로 /api/chats/stream을 열고 응답을 줄 단위로 읽어 이벤트를 나눕니다(토큰을 주소에 넣지 않음).
 * - 받은 이벤트는 window의 'movrit:chat-event'(detail: {type, data})로 다시 알립니다. 대화 화면·목록·배지가 이 이벤트를 듣습니다.
 * - 연결이 끊기면 2초부터 최대 30초까지 늘려 가며 다시 연결합니다. 로그아웃 상태면 연결하지 않습니다.
 * - 연결 중인지(isChatStreamConnected)를 보고 화면은 주기적 확인(폴링) 간격을 늘립니다.
 * - 화면은 acquireChatStream()으로 사용을 알리고, 돌려받은 함수로 사용을 끝냅니다.
 */
export const CHAT_EVENT = 'movrit:chat-event'

let controller = null
let connected = false
let retryMs = 2000
let retryTimer = null
let closeTimer = null
let users = 0

export function isChatStreamConnected() {
  return connected
}

// SSE 본문 한 덩어리(event/data 줄)를 이벤트로 바꿉니다. 화면 없이 테스트할 수 있게 내보냅니다.
export function parseSseBlock(block) {
  let type = 'message'
  const data = []
  for (const line of block.split('\n')) {
    if (line.startsWith(':')) continue
    if (line.startsWith('event:')) type = line.slice(6).trim()
    else if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
  }
  if (!data.length) return null
  const text = data.join('\n')
  try {
    return { type, data: text ? JSON.parse(text) : null }
  } catch {
    return { type, data: text }
  }
}

function emit(type, data) {
  window.dispatchEvent(new CustomEvent(CHAT_EVENT, { detail: { type, data } }))
}

async function connect() {
  const token = sessionStorage.getItem('accessToken')
  if (!token || users === 0) return
  controller = new AbortController()
  try {
    const response = await fetch('/api/chats/stream', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      signal: controller.signal,
    })
    if (!response.ok || !response.body)
      throw new Error(`stream ${response.status}`)
    connected = true
    retryMs = 2000
    emit('connected', null)
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
      let index
      while ((index = buffer.indexOf('\n\n')) >= 0) {
        const event = parseSseBlock(buffer.slice(0, index))
        buffer = buffer.slice(index + 2)
        if (event && event.type !== 'ping') emit(event.type, event.data)
      }
    }
  } catch {
    // 끊김·인증 만료는 아래에서 다시 연결합니다.
  }
  connected = false
  const aborted = controller?.signal.aborted
  controller = null
  emit('disconnected', null)
  if (users > 0 && !aborted) {
    retryTimer = setTimeout(connect, retryMs)
    retryMs = Math.min(retryMs * 2, 30000)
  }
}

// 화면이 연결을 쓰기 시작할 때 부릅니다. 돌려준 함수를 부르면 사용을 끝냅니다(마지막 사용자가 끝나면 연결을 닫습니다).
// 페이지를 옮기며 화면이 잠깐 다시 그려질 때 연결이 끊겼다 붙지 않도록, 마지막 사용자가 끝나도 5초 기다린 뒤 닫습니다.
export function acquireChatStream() {
  users += 1
  clearTimeout(closeTimer)
  if (users === 1 && !connected && !controller) connect()
  return () => {
    users -= 1
    if (users > 0) return
    closeTimer = setTimeout(() => {
      if (users > 0) return
      clearTimeout(retryTimer)
      controller?.abort()
      controller = null
      connected = false
    }, 5000)
  }
}
