/**
 * 공개 전용 표시정보에서 이미지와 현재 공개 방문 장소만 렌더링합니다.
 * 조회 실패에는 재시도 안내를 표시하며 소유자 미리보기나 과거 신청 증빙을 대신 사용하지 않습니다.
 */
import { useEffect, useState } from 'react'
import { liveCampaignMediaApi } from '../../api/liveCampaignMediaApi'
import './campaignPublicMedia.css'

export default function CampaignPublicMedia({ campaignId }) {
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: false,
  })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    liveCampaignMediaApi
      .publicPresentation(campaignId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ loading: false, data, error: false })
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setState({ loading: false, data: null, error: true })
      })
    return () => controller.abort()
  }, [campaignId, attempt])
  if (state.loading)
    return <p role="status">이미지와 방문 정보를 불러오는 중입니다.</p>
  if (state.error)
    return (
      <section aria-label="캠페인 이미지 조회 오류">
        <p role="alert">이미지와 방문 정보를 불러오지 못했습니다.</p>
        <button
          type="button"
          onClick={() => {
            setState({ loading: true, data: null, error: false })
            setAttempt((value) => value + 1)
          }}
        >
          다시 시도
        </button>
      </section>
    )
  const { representativeImageUrl, detailImages, visitLocation } = state.data
  return (
    <section
      className="campaign-public-media"
      aria-label="캠페인 이미지와 방문 장소"
    >
      {representativeImageUrl && (
        <img src={representativeImageUrl} alt="캠페인 대표 이미지" />
      )}
      {detailImages.map((image, index) => (
        <figure key={`${index}-${image.imageUrl}`}>
          <img
            src={image.imageUrl}
            alt={image.altText || `캠페인 상세 이미지 ${index + 1}`}
            loading="lazy"
          />
          {image.altText && <figcaption>{image.altText}</figcaption>}
        </figure>
      ))}
      {visitLocation && (
        <section>
          <h2>방문 장소</h2>
          <strong>{visitLocation.venueName}</strong>
          <p>
            {visitLocation.postalCode && `(${visitLocation.postalCode}) `}
            {visitLocation.address1}
            {visitLocation.address2 && ` ${visitLocation.address2}`}
          </p>
        </section>
      )}
    </section>
  )
}
