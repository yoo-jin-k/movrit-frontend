import { useEffect, useState } from 'react'
import { readBusinessList } from './businessApi'
export default function useBusinessList(path) {
  const [state, setState] = useState({ loading: true, data: [], error: '' })
  const [revision, setRevision] = useState(0)
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
