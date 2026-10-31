/**
 * 운영자 화면에서 서버 데이터 한 건(목록 또는 상세)을 불러옵니다.
 *
 * - 경로가 바뀌거나 reload()를 부르면 다시 불러오고, 이전 요청은 취소합니다.
 * - 403은 권한 안내, 404는 '찾을 수 없음' 안내로 구분합니다.
 */
import { useEffect, useState } from 'react'
import api from '../../api/axios'

export default function useAdminResource(path, initial = null) {
  const [state, setState] = useState({
    loading: true,
    data: initial,
    error: '',
  })
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    api
      .get(path, { signal: controller.signal, timeout: 15000 })
      .then(({ data }) => {
        if (!controller.signal.aborted)
          setState({ loading: false, data, error: '' })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        const status = error.response?.status
        setState({
          loading: false,
          data: initial,
          error:
            status === 403
              ? '이 정보를 볼 운영자 권한이 없습니다.'
              : status === 404
                ? '요청한 정보를 찾을 수 없습니다.'
                : '정보를 불러오지 못했습니다. 다시 시도해 주세요.',
        })
      })
    return () => controller.abort()
    // initial은 화면별 고정값이므로 다시 불러오는 조건에서 제외합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, revision])

  return {
    ...state,
    reload: () => {
      setState((current) => ({ ...current, loading: true, error: '' }))
      setRevision((value) => value + 1)
    },
  }
}
