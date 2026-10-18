/**
 * 이미지 선택·정렬·설명과 방문 주소 확인을 화면 초안에 반영합니다.
 * 파일은 선택 시 검증하고 미리보기 URL은 사용이 끝나면 해제하며 업로드는 부모 저장 흐름이 담당합니다.
 */
import { useEffect, useRef, useState } from 'react'
import {
  appendDetailImage,
  moveDetailImage,
  removeDetailImage,
  updateDetailAltText,
} from './campaignMediaDraft'
import {
  validateCampaignImageFile,
  validateVisitLocationInput,
} from './campaignMediaValidation'
import './campaignMedia.css'

// 선택 파일 또는 인증 blob의 임시 URL을 이미지에 연결하고 파일 교체·언마운트 시 URL을 해제합니다.
function LocalImage({ image }) {
  const imageRef = useRef(null)
  useEffect(() => {
    if (!image?.file || !imageRef.current) return
    const element = imageRef.current
    const url = URL.createObjectURL(image.file)
    element.src = url
    return () => {
      element.removeAttribute('src')
      URL.revokeObjectURL(url)
    }
  }, [image?.file])
  return image?.file ? (
    <img ref={imageRef} alt={image.altText || '선택한 이미지 미리보기'} />
  ) : (
    <p>미리보기 준비 중</p>
  )
}

// 파일 선택과 입력만 담당합니다. 업로드·저장 상태는 서버 응답을 확인한 부모에서 관리합니다.
export default function CampaignMediaFields({
  value,
  onChange,
  fulfillmentTypes = [],
  disabled = false,
}) {
  const [error, setError] = useState('')
  const visit = fulfillmentTypes.includes('VISIT')
  // 선택한 파일을 먼저 검증한 다음 새 초안을 한 번에 전달합니다.
  // 파일 선택 입력을 비워 같은 파일을 다시 고를 수 있게 하며 오류 시 부모의 기존 목록을 유지합니다.
  function choose(event, representative) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    try {
      files.forEach(validateCampaignImageFile)
      if (representative && files.length !== 1)
        throw new Error('대표 이미지는 1장만 선택해 주세요.')
      let next = value
      for (const file of files) {
        const image = {
          key: crypto.randomUUID(),
          file,
          altText: '',
          status: 'pending',
        }
        next = representative
          ? { ...next, representative: image }
          : appendDetailImage(next, image)
      }
      onChange(next)
      setError('')
    } catch (failure) {
      setError(failure.message)
    }
  }
  // 주소 일부가 바뀌면 이전 공개 확인을 해제하여 수정된 주소를 다시 확인하도록 합니다.
  function locationField(key, text) {
    setError('')
    onChange({
      ...value,
      location: { ...value.location, [key]: text },
      locationConfirmed: false,
    })
  }
  // 확인 체크를 켤 때 필수 주소와 길이를 검사하며, 성공한 정규화 값만 부모 초안으로 전달합니다.
  function confirmLocation(checked) {
    try {
      const location = checked
        ? validateVisitLocationInput(value.location)
        : value.location
      onChange({ ...value, location, locationConfirmed: checked })
      setError('')
    } catch (failure) {
      setError(failure.message)
    }
  }
  return (
    <section className="campaign-media" aria-label="캠페인 이미지와 방문 장소">
      <fieldset disabled={disabled}>
        <legend>캠페인 이미지</legend>
        <p>
          JPG·PNG·WebP, 파일당 5MiB 이하. 선택한 파일은 저장 전 미리보기입니다.
        </p>
        <label className="campaign-media-upload">
          대표 이미지 · 1장
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => choose(event, true)}
          />
        </label>
        {value.representative && (
          <div className="campaign-media-cover">
            <LocalImage
              key={value.representative.key}
              image={value.representative}
            />
            <span>
              {value.representative.file?.name || '대표 이미지'} ·{' '}
              {value.representative.status === 'existing'
                ? '저장됨'
                : '저장 전'}
            </span>
          </div>
        )}
        <label className="campaign-media-upload">
          상세 이미지 · {value.details.length}/5장
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled || value.details.length >= 5}
            onChange={(event) => choose(event, false)}
          />
        </label>
        {value.details.length === 0 && (
          <p>등록할 상세 이미지를 선택해 주세요.</p>
        )}
        <ol className="campaign-media-list">
          {value.details.map((image, index) => (
            <li key={image.key}>
              <LocalImage image={image} />
              <div className="campaign-media-item">
                <strong>
                  {index + 1}. {image.file?.name || '상세 이미지'}
                </strong>
                <label>
                  이미지 설명 · {Array.from(image.altText).length}/200자
                  <input
                    value={image.altText}
                    onChange={(event) => {
                      try {
                        onChange(
                          updateDetailAltText(
                            value,
                            image.key,
                            event.target.value,
                          ),
                        )
                        setError('')
                      } catch (failure) {
                        setError(failure.message)
                      }
                    }}
                  />
                </label>
                <div className="campaign-media-actions">
                  <button
                    type="button"
                    aria-label={`${index + 1}번 이미지 앞으로 이동`}
                    disabled={index === 0}
                    onClick={() =>
                      onChange(moveDetailImage(value, image.key, -1))
                    }
                  >
                    앞으로
                  </button>
                  <button
                    type="button"
                    aria-label={`${index + 1}번 이미지 뒤로 이동`}
                    disabled={index === value.details.length - 1}
                    onClick={() =>
                      onChange(moveDetailImage(value, image.key, 1))
                    }
                  >
                    뒤로
                  </button>
                  <button
                    type="button"
                    aria-label={`${index + 1}번 이미지 선택 취소`}
                    onClick={() =>
                      onChange(removeDetailImage(value, image.key))
                    }
                  >
                    선택 취소
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </fieldset>
      {visit ? (
        <fieldset disabled={disabled}>
          <legend>공개 방문 장소</legend>
          <p>
            방문할 사업장 주소를 입력해 주세요. 개인 주거지·연락처·출입
            비밀번호는 입력하지 마세요.
          </p>
          <div className="campaign-media-address">
            {[
              ['venueName', '장소명', 100],
              ['postalCode', '우편번호 (선택)', 5],
              ['address1', '기본 주소', 255],
              ['address2', '상세 주소 (선택)', 255],
            ].map(([key, label, limit]) => (
              <label key={key}>
                {label}
                <input
                  value={value.location?.[key] || ''}
                  maxLength={limit}
                  inputMode={key === 'postalCode' ? 'numeric' : undefined}
                  onChange={(event) => locationField(key, event.target.value)}
                />
              </label>
            ))}
          </div>
          <label className="campaign-media-confirm">
            <input
              type="checkbox"
              checked={value.locationConfirmed}
              onChange={(event) => confirmLocation(event.target.checked)}
            />
            공개 가능한 사업장 주소임을 확인했습니다.
          </label>
          {value.locationConfirmed && (
            <p role="status">주소 입력 확인 완료 · 저장 전</p>
          )}
        </fieldset>
      ) : (
        <p>방문형을 선택하면 공개 방문 장소를 입력할 수 있습니다.</p>
      )}
      {error && (
        <p role="alert" className="campaign-media-error">
          {error}
        </p>
      )}
    </section>
  )
}
