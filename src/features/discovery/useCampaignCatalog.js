/**
 * 개발 환경과 VITE_CAMPAIGN_DATA_MODE 설정에 따라 예시 또는 실제 목록을 선택합니다.
 * 실제 모드의 빈 응답·오류는 그대로 유지하며 요청 취소 후 상태 갱신을 막습니다.
 */
import { useEffect, useState } from 'react'
import { readCampaigns, campaignReadError } from '../../api/campaignReadApi'
import { adaptCampaignList } from './campaignReadAdapter'
import { PREVIEW_CAMPAIGNS } from './catalog'

export const isCampaignPreview =
  import.meta.env.DEV && import.meta.env.VITE_CAMPAIGN_DATA_MODE !== 'live'

// 개발 미리보기는 명시적으로 분리하고 실제 조회 실패·빈 목록을 샘플 성공으로 바꾸지 않습니다.
export function useCampaignCatalog() {
  const [state, setState] = useState({
    items: isCampaignPreview ? PREVIEW_CAMPAIGNS : [],
    loading: !isCampaignPreview,
    error: '',
  })
  useEffect(() => {
    if (isCampaignPreview) return
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
  }, [])
  return { ...state, previewMode: isCampaignPreview }
}
