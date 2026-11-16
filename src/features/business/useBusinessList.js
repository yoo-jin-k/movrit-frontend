/**
 * 업체 목록의 로딩·오류·데이터와 다시 조회할 수 있는 상태를 관리합니다.
 * 화면 정리 시 요청을 취소하고 취소된 응답이 현재 목록을 덮어쓰지 않게 합니다.
 *
 * refreshMs를 주면 화면이 보이는 동안 그 간격마다, 그리고 창으로 돌아올 때마다 목록을 조용히 다시 불러옵니다.
 * 조용한 새로고침은 '불러오는 중' 표시 없이 데이터만 바꾸며, 실패하면 기존 목록을 그대로 둡니다.
 * (참여자가 다른 기기에서 수락·취소해도 업체 화면에 곧 반영되도록 하기 위함입니다.)
 */
import { useEffect, useState } from 'react'
import { readBusinessList } from '../../api/businessApi'
export default function useBusinessList(path, { refreshMs = 0 } = {}) {
  const [state, setState] = useState({ loading: true, data: [], error: '' })
  const [revision, setRevision] = useState(0)
  // 경로나 재조회 번호가 바뀔 때 새 요청을 시작하고 이전 요청은 취소합니다.
  useEffect(() => {
    const controller = new AbortController()
    readBusinessList(path, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ loading: false, data, error: '' })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            loading: false,
            data: [],
            error:
              error.response?.status === 403
                ? '이 업무를 조회할 권한이 없습니다.'
                : '정보를 불러오지 못했습니다. 다시 시도해 주세요.',
          })
      })
    return () => controller.abort()
  }, [path, revision])
  // 주기적·창 복귀 시 조용한 새로고침입니다. 화면이 숨겨져 있으면 건너뜁니다.
  useEffect(() => {
    if (!refreshMs) return undefined
    let controller = null
    const refresh = () => {
      if (document.visibilityState !== 'visible') return
      controller?.abort()
      controller = new AbortController()
      const signal = controller.signal
      readBusinessList(path, signal)
        .then((data) => {
          if (!signal.aborted)
            setState((current) =>
              current.loading ? current : { loading: false, data, error: '' },
            )
        })
        .catch(() => {
          // 조용한 새로고침 실패는 기존 목록을 유지합니다.
        })
    }
    const timer = window.setInterval(refresh, refreshMs)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
      controller?.abort()
    }
  }, [path, refreshMs])
  return {
    ...state,
    reload: () => {
      setState({ loading: true, data: [], error: '' })
      setRevision((v) => v + 1)
    },
  }
}
