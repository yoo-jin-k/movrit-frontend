/**
 * 업체 목록의 로딩·오류·데이터와 다시 조회할 수 있는 상태를 관리합니다.
 * 화면 정리 시 요청을 취소하고 취소된 응답이 현재 목록을 덮어쓰지 않게 합니다.
 */
import { useEffect, useState } from 'react'
import { readBusinessList } from './businessApi'
export default function useBusinessList(path) {
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
  return {
    ...state,
    reload: () => {
      setState({ loading: true, data: [], error: '' })
      setRevision((v) => v + 1)
    },
  }
}
