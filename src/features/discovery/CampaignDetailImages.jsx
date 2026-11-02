/**
 * 캠페인 상세의 '상세페이지' 탭 내용입니다. 브랜드가 등록한 긴 상세 이미지를 위에서 아래로 이어 보여 줍니다.
 *
 * - 등록 순서대로, 사이 간격 없이 본문 폭에 맞춰 보여 줍니다(좁은 화면에서는 비율을 지키며 함께 줄어듭니다).
 * - 이미지는 화면 가까이 왔을 때 불러오고(loading="lazy"), 그동안 자리를 먼저 잡아 둡니다.
 * - 이미지마다 붙은 설명은 화면 읽기용 대체 글로 씁니다.
 * - 새 방식 이미지가 없으면 예전 방식으로 등록된 상세 이미지 한 장(legacyImageUrl)을 보여 줍니다.
 */
import { useState } from 'react'

// 이미지 한 장입니다. 다 불러오기 전에는 회색 자리를 보여 주고, 실패하면 안내 문구로 바꿉니다.
function DetailImage({ src, alt }) {
  const [status, setStatus] = useState('loading')
  return (
    <figure className={`campaign-detail-images__item is-${status}`}>
      {status === 'error' ? (
        <p>이미지를 불러오지 못했습니다.</p>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
    </figure>
  )
}

/**
 * @param {{imageUrl: string, altText?: string}[]} images 표시정보 API의 상세 이미지 목록
 * @param {string|null} legacyImageUrl 예전 방식 상세 이미지 주소
 * @param {boolean} loading 표시정보를 불러오는 중인지
 * @param {boolean} error 표시정보를 불러오지 못했는지
 * @param {() => void} onRetry 다시 시도
 */
export default function CampaignDetailImages({
  images = [],
  legacyImageUrl = null,
  loading = false,
  error = false,
  onRetry,
}) {
  if (loading) return <p role="status">상세페이지를 불러오는 중입니다.</p>
  if (error)
    return (
      <div className="campaign-detail__empty" role="alert">
        <p>상세페이지를 불러오지 못했습니다.</p>
        <button type="button" onClick={onRetry}>
          다시 시도
        </button>
      </div>
    )
  const list = images.length
    ? images
    : legacyImageUrl
      ? [{ imageUrl: legacyImageUrl, altText: '' }]
      : []
  if (!list.length)
    return (
      <p className="campaign-detail__empty">등록된 상세페이지가 없습니다.</p>
    )
  return (
    <div className="campaign-detail-images">
      {list.map((image, index) => (
        <DetailImage
          key={`${index}-${image.imageUrl}`}
          src={image.imageUrl}
          alt={image.altText || `캠페인 상세 이미지 ${index + 1}`}
        />
      ))}
    </div>
  )
}
