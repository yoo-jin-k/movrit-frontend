/** 기본값과 알 수 없는 설정은 실제 조회이며 개발 환경의 명시적 preview만 예시를 허용합니다. */
export function campaignPreviewEnabled({ dev, mode, forceLive = false }) {
  return Boolean(dev && mode === 'preview' && !forceLive)
}

// 예시 환경에서도 이 경로는 서버 목록을 조회하며 예시 ID를 다른 ID로 바꾸지 않습니다.
export const LIVE_CAMPAIGN_LIST = '/category/제품?data=live'
