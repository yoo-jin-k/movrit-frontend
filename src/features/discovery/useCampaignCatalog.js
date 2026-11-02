/**
 * 개발 환경과 VITE_CAMPAIGN_DATA_MODE 설정에 따라 예시 또는 실제 목록을 선택합니다.
 * 실제 모드의 빈 응답·오류는 그대로 유지하며 요청 취소 후 상태 갱신을 막습니다.
 */
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { campaignPreviewEnabled } from './campaignDataMode'
import {
  readCampaignPage,
  readCampaigns,
  campaignReadError,
} from '../../api/campaignReadApi'
import { adaptCampaignList } from './campaignReadAdapter'
import { PREVIEW_CAMPAIGNS } from './catalog'
import {
  PAGE_SIZE,
  filterPreviewCampaigns,
  serverSearchParams,
} from './campaignSearchModel'

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

/**
 * 캠페인 목록 화면의 조건(검색어·종류·카테고리·미디어·지역·정렬·페이지)으로 한 페이지를 가져옵니다.
 * 실제 데이터는 서버가 거르고 나누며, 개발 미리보기만 예시 데이터에 같은 조건을 화면에서 적용합니다.
 */
export function useCampaignSearch(options) {
  const previewMode = useCampaignPreview()
  const params = serverSearchParams(options)
  const key = JSON.stringify(params)
  const [state, setState] = useState({
    key: '',
    items: [],
    total: 0,
    totalPages: 0,
    error: '',
  })
  useEffect(() => {
    if (previewMode) return
    const controller = new AbortController()
    readCampaignPage(JSON.parse(key), controller.signal)
      .then((page) => {
        if (!controller.signal.aborted)
          setState({
            key,
            items: page.items,
            total: page.total,
            totalPages: page.totalPages,
            error: '',
          })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            key,
            items: [],
            total: 0,
            totalPages: 0,
            error: campaignReadError(error),
          })
      })
    return () => controller.abort()
  }, [previewMode, key])
  if (previewMode) {
    const all = filterPreviewCampaigns(PREVIEW_CAMPAIGNS, options)
    const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
    const page = Math.min(Math.max(1, options.page || 1), totalPages)
    return {
      items: all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      total: all.length,
      totalPages,
      loading: false,
      error: '',
      previewMode: true,
    }
  }
  return {
    items: state.key === key ? state.items : [],
    total: state.key === key ? state.total : 0,
    totalPages: state.key === key ? state.totalPages : 0,
    loading: state.key !== key,
    error: state.key === key ? state.error : '',
    previewMode: false,
  }
}
