/**
 * 개발 환경과 VITE_CAMPAIGN_DATA_MODE 설정에 따라 예시 또는 실제 목록을 선택합니다.
 * 실제 모드의 빈 응답·오류는 그대로 유지하며 요청 취소 후 상태 갱신을 막습니다.
 */
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { campaignPreviewEnabled } from './campaignDataMode'
import { readCampaigns, campaignReadError } from '../../api/campaignReadApi'
import { adaptCampaignList } from './campaignReadAdapter'
import { PREVIEW_CAMPAIGNS } from './catalog'

export function useCampaignPreview() {
  const [params] = useSearchParams()
  return campaignPreviewEnabled({
    dev: import.meta.env.DEV,
    mode: import.meta.env.VITE_CAMPAIGN_DATA_MODE,
    forceLive: params.get('data') === 'live',
  })
}

// 개발 미리보기는 명시적으로 분리하고 실제 조회 실패·빈 목록을 샘플 성공으로 바꾸지 않습니다.
export function useCampaignCatalog() {
  const previewMode = useCampaignPreview()
  const [state, setState] = useState({
    items: [],
    loading: true,
    error: '',
  })
  useEffect(() => {
    if (previewMode) return
    const controller = new AbortController()
    readCampaigns(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({
            items: adaptCampaignList(data),
            loading: false,
            error: '',
          })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            items: [],
            loading: false,
            error: campaignReadError(error),
          })
      })
    return () => controller.abort()
  }, [previewMode])
  // 예시 데이터는 실제 요청 상태에 넣지 않으므로 전환·빈 목록·실패에도 섞이지 않습니다.
  return previewMode
    ? { items: PREVIEW_CAMPAIGNS, loading: false, error: '', previewMode: true }
    : { ...state, previewMode: false }
}
