/**
 * 미리보기 카드의 찜을 세션 저장소와 변경 이벤트로 공유합니다.
 * 저장소 사용이 제한되면 현재 탭의 메모리를 쓰며 서버 찜 API는 호출하지 않습니다.
 */
import { useSyncExternalStore } from 'react'

const EVENT = 'movrit-preview-favorites-changed'
const fallback = new Map()

// 같은 캠페인이 여러 섹션에 나타나도 하나의 세션 선택 상태를 함께 구독합니다.
function subscribe(listener) {
  window.addEventListener(EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

export function usePreviewFavorite(campaignId) {
  const key = `preview-saved-${campaignId}`
  const read = () => {
    if (fallback.has(key)) return fallback.get(key)
    try {
      return sessionStorage.getItem(key) === '1'
    } catch {
      return fallback.get(key) || false
    }
  }
  // 같은 캠페인 카드가 여러 곳에 있어도 저장소 변경을 함께 구독하도록 React 외부 저장소 훅을 사용합니다.
  const saved = useSyncExternalStore(subscribe, read, () => false)

  // 서버 찜과 혼동하지 않도록 미리보기 저장소만 변경하고 모든 카드에 알립니다.
  const toggle = () => {
    const next = !read()
    fallback.set(key, next)
    try {
      sessionStorage.setItem(key, next ? '1' : '0')
    } catch {
      // 저장소가 제한된 브라우저에서는 현재 탭의 메모리 상태만 유지합니다.
    }
    window.dispatchEvent(new Event(EVENT))
  }
  return [saved, toggle]
}
