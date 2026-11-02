/**
 * 캠페인 공개 표시정보(대표 이미지·상세 이미지·방문 장소)를 불러오는 훅입니다.
 *
 * - GET /api/campaigns/{id}/presentation/public 결과만 씁니다. 업체용 미리보기나 신청 증빙 이미지를 대신 쓰지 않습니다.
 * - reloadKey가 바뀌면(상세 '정보 새로고침') 다시 불러옵니다.
 * - 실패하면 error=true로 두고, 화면에서 '다시 시도'를 누르면 retry로 다시 부릅니다.
 */
import { useEffect, useState } from 'react'
import { liveCampaignMediaApi } from '../../api/liveCampaignMediaApi'

export function useCampaignPresentation(campaignId, reloadKey = 0) {
  const [state, setState] = useState({
    key: null,
    data: null,
    error: false,
  })
  const [attempt, setAttempt] = useState(0)
  const key = `${campaignId}:${reloadKey}:${attempt}`

  useEffect(() => {
    const controller = new AbortController()
    liveCampaignMediaApi
      .publicPresentation(campaignId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ key, data, error: false })
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setState({ key, data: null, error: true })
      })
    return () => controller.abort()
  }, [campaignId, key])

  return {
    loading: state.key !== key,
    data: state.key === key ? state.data : null,
    error: state.key === key && state.error,
    retry: () => setAttempt((value) => value + 1),
  }
}
