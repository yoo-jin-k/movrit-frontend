// ff7caa6 읽기 DTO 전용입니다. detailImageId는 업로드 자산 ID가 아닙니다.
// URL을 공개/인증 미리보기로 판정하거나 네트워크 요청을 수행하지 않습니다.
export function readCampaignDetailImages(presentation) {
  const images = presentation?.detailImages
  if (!Array.isArray(images) || images.length > 5)
    throw new Error('상세 이미지 목록을 다시 확인해 주세요.')
  const ids = new Set(),
    orders = new Set()
  const result = images.map((image) => {
    if (
      !Number.isSafeInteger(image?.id) ||
      image.id <= 0 ||
      !Number.isInteger(image.displayOrder) ||
      image.displayOrder < 0 ||
      image.displayOrder >= images.length ||
      ids.has(image.id) ||
      orders.has(image.displayOrder) ||
      typeof image.imageUrl !== 'string' ||
      !image.imageUrl.trim() ||
      (image.altText != null && typeof image.altText !== 'string')
    )
      throw new Error(
        '상세 이미지 응답이 올바르지 않습니다. 최신 내용을 확인해 주세요.',
      )
    ids.add(image.id)
    orders.add(image.displayOrder)
    return {
      key: `detail-${image.id}`,
      detailImageId: image.id,
      sourceUrl: image.imageUrl,
      displayOrder: image.displayOrder,
      altText: image.altText ?? '',
      status: 'existing',
    }
  })
  return result.sort((a, b) => a.displayOrder - b.displayOrder)
}
