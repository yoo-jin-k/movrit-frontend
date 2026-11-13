/**
 * 캠페인 상세 '방문 장소'에 붙는 지도 보기 링크와 주소 복사 버튼입니다.
 * - 지도 API 키 없이 카카오맵·네이버 지도 검색 화면을 새 창으로 엽니다(visitMapModel).
 * - 주소 복사는 브라우저 클립보드를 쓰며, 실패하면 직접 선택해 달라고 안내합니다.
 */
import { useState } from 'react'
import { visitAddressText, visitMapLinks } from './visitMapModel'

export default function VisitMapLinks({ location }) {
  const [copyStatus, setCopyStatus] = useState('')
  const links = visitMapLinks(location)
  const address = visitAddressText(location)
  if (!links.length) return null

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopyStatus('주소를 복사했습니다.')
    } catch {
      setCopyStatus('복사하지 못했습니다. 주소를 직접 선택해 복사해 주세요.')
    }
  }

  return (
    <div className="visit-map">
      <div className="visit-map__actions">
        {links.map((link) => (
          <a
            key={link.key}
            className="discovery-outline-button visit-map__link"
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.label}에서 보기
            <span className="visually-hidden"> (새 창)</span>
          </a>
        ))}
        <button
          type="button"
          className="discovery-outline-button visit-map__link"
          onClick={copyAddress}
        >
          주소 복사
        </button>
      </div>
      <p className="visit-map__status" role="status">
        {copyStatus}
      </p>
    </div>
  )
}
