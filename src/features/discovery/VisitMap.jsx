/**
 * 캠페인 상세 '방문 장소'에 네이버 지도를 그립니다.
 * - 도로명 주소(address1)를 geocoder로 좌표로 바꾼 뒤 지도와 마커를 표시합니다.
 * - 키가 없으면 그리지 않고, 인증·주소 검색이 실패하면 칸을 접습니다(아래 지도 링크·주소 복사는 그대로 남습니다).
 * - 지도는 만들 때 칸 크기가 정해져 있어야 하므로 불러오는 동안에도 칸 높이를 유지합니다.
 * - 주소가 바뀌면 부모가 key로 새로 만들어 상태를 처음부터 다시 시작합니다.
 */
import { useEffect, useRef, useState } from 'react'
import { loadNaverMaps } from './naverMapLoader'
import { geocodePoint } from './visitMapModel'

const hasKey = Boolean(
  String(import.meta.env.VITE_NAVER_MAP_KEY_ID ?? '').trim(),
)

export default function VisitMap({ location }) {
  const box = useRef(null)
  const [status, setStatus] = useState('loading')
  const address = String(location?.address1 ?? '').trim()
  const venue = location?.venueName || '방문 장소'

  useEffect(() => {
    if (!hasKey || !address) return undefined
    let cancelled = false
    let map = null
    loadNaverMaps()
      .then(
        (maps) =>
          new Promise((resolve, reject) => {
            maps.Service.geocode({ query: address }, (result, response) => {
              const point =
                result === maps.Service.Status.OK && geocodePoint(response)
              return point
                ? resolve({ maps, point })
                : reject(new Error('주소를 찾지 못했습니다.'))
            })
          }),
      )
      .then(({ maps, point }) => {
        if (cancelled || !box.current) return
        const center = new maps.LatLng(point.lat, point.lng)
        map = new maps.Map(box.current, { center, zoom: 16 })
        new maps.Marker({ position: center, map, title: venue })
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('failed')
      })
    return () => {
      cancelled = true
      map?.destroy()
    }
  }, [address, venue])

  if (!hasKey || !address) return null
  return (
    <div
      ref={box}
      className={`visit-map__canvas visit-map__canvas--${status}`}
      role="img"
      aria-label={`${venue} 위치 지도`}
      aria-busy={status === 'loading'}
    />
  )
}
