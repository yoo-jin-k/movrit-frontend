/**
 * 네이버 지도 스크립트를 한 번만 불러옵니다.
 * - 키(VITE_NAVER_MAP_KEY_ID)가 없거나, 스크립트를 못 받거나, 인증이 실패하면 거절된 Promise를 돌려줍니다.
 * - 인증 실패는 네이버 지도가 부르는 전역 함수 navermap_authFailure로만 알 수 있습니다.
 * - geocoder 하위 모듈은 maps.js를 받은 뒤 따로 내려오므로, 준비 완료 알림(onJSContentLoaded)까지 기다립니다.
 */
import { naverMapScriptUrl } from './visitMapModel'

const WAIT_MS = 10000
let loading = null

export function loadNaverMaps() {
  if (loading) return loading
  const src = naverMapScriptUrl(import.meta.env.VITE_NAVER_MAP_KEY_ID)
  if (!src) return Promise.reject(new Error('지도 키가 없습니다.'))
  loading = new Promise((resolve, reject) => {
    const fail = (message) => () => reject(new Error(message))
    const timer = setTimeout(
      fail('네이버 지도 준비가 늦어지고 있습니다.'),
      WAIT_MS,
    )
    const done = () => {
      clearTimeout(timer)
      resolve(window.naver.maps)
    }
    window.navermap_authFailure = () => {
      clearTimeout(timer)
      reject(new Error('네이버 지도 인증에 실패했습니다.'))
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => {
      const maps = window.naver?.maps
      if (!maps) return fail('네이버 지도를 불러오지 못했습니다.')()
      if (maps.Service) return done()
      maps.onJSContentLoaded = done
    }
    script.onerror = () => {
      clearTimeout(timer)
      reject(new Error('네이버 지도를 불러오지 못했습니다.'))
    }
    document.head.appendChild(script)
  })
  // 실패하면 다음 화면에서 다시 시도할 수 있게 비웁니다.
  loading.catch(() => {
    loading = null
  })
  return loading
}
