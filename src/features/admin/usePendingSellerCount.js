/**
 * 운영자 왼쪽 메뉴 '업체' 옆에 보여줄 심사 대기 업체 수를 불러옵니다.
 *
 * - 서버 API: GET /api/admin/sellers/pending (운영자 전용, 기존 대기 목록을 그대로 셉니다)
 * - 화면을 옮길 때마다 레이아웃이 새로 그려지므로 30초 동안은 마지막 값을 다시 씁니다.
 * - 업체 승인·반려 뒤 notifyPendingSellersChanged()를 부르면 바로 다시 셉니다.
 * - 조회에 실패하면 배지를 그리지 않습니다(메뉴 자체는 그대로 씁니다).
 */
import { useEffect, useState } from 'react'
import { getPendingSellers } from '../../api/adminSellerApi'
import { pendingCountFrom } from './adminSellerListModel'

const CACHE_MS = 30_000
const CHANGED_EVENT = 'movrit:admin-pending-sellers-changed'
let cache = { count: null, at: 0 }

/** 업체 심사 상태가 바뀌었음을 알립니다. 열려 있는 메뉴 배지가 다시 셉니다. */
export function notifyPendingSellersChanged() {
  cache = { count: cache.count, at: 0 }
  window.dispatchEvent(new Event(CHANGED_EVENT))
}

export default function usePendingSellerCount() {
  const [count, setCount] = useState(cache.count)

  useEffect(() => {
    let controller = null
    const load = (force) => {
      if (!force && Date.now() - cache.at < CACHE_MS) return
      controller?.abort()
      controller = new AbortController()
      const signal = controller.signal
      getPendingSellers(signal)
        .then((data) => {
          if (signal.aborted) return
          const next = pendingCountFrom(data)
          cache = { count: next, at: Date.now() }
          setCount(next)
        })
        .catch(() => {
          // 배지는 보조 정보라 실패해도 안내 없이 숨깁니다.
          if (!signal.aborted) setCount(null)
        })
    }
    load(false)
    const onChanged = () => load(true)
    window.addEventListener(CHANGED_EVENT, onChanged)
    return () => {
      window.removeEventListener(CHANGED_EVENT, onChanged)
      controller?.abort()
    }
  }, [])

  return count
}
