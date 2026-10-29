/** 선택한 신청의 응답만 반영합니다. 취소 신호를 무시한 늦은 응답도 이전 선택의 화면을 덮지 못합니다. */
import { useEffect, useState } from 'react'
export default function useParticipantDetail(applicationId, load) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({
    id: applicationId,
    data: null,
    loading: true,
    error: '',
  })
  if (state.id !== applicationId) {
    setState({ id: applicationId, data: null, loading: true, error: '' })
  }
  useEffect(() => {
    if (applicationId == null) return
    const controller = new AbortController()
    let active = true
    load(applicationId, controller.signal)
      .then((data) => {
        if (active && !controller.signal.aborted)
          setState({ id: applicationId, data, loading: false, error: '' })
      })
      .catch(() => {
        if (active && !controller.signal.aborted)
          setState({
            id: applicationId,
            data: null,
            loading: false,
            error: '참여자 상세를 불러오지 못했습니다. 다시 확인해 주세요.',
          })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [applicationId, attempt, load])
  const reload = () => {
    setState({ id: applicationId, data: null, loading: true, error: '' })
    setAttempt((value) => value + 1)
  }
  return {
    ...(state.id === applicationId
      ? state
      : { data: null, loading: true, error: '' }),
    reload,
  }
}
