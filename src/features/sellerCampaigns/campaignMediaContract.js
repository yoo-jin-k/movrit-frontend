/**
 * 화면 초안을 UUID 자산 참조와 표시정보 버전을 포함한 저장 계약으로 변환합니다.
 * 이미지 전체 목록과 주소의 생략·null·객체 의미를 구분하고 업로드 전 입력 검증도 제공합니다.
 */
import {
  validateVisitLocationInput,
  validateCampaignImageFile,
} from './campaignMediaValidation.js'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// 숫자 이미지 행 ID나 URL이 UUID 자산 참조로 들어오지 않도록 검사하고 소문자로 정규화합니다.
export function requireAssetId(value) {
  if (typeof value !== 'string' || !UUID.test(value))
    throw new Error('이미지 업로드 결과를 확인해 주세요.')
  return value.toLowerCase()
}
// 대표와 상세 전체를 치환할 요청을 만듭니다. 수정에는 표시 버전이 필요하고 신규 생성은 버전 필드를 생략합니다.
export function presentationRequest(
  draft,
  {
    editing = false,
    version,
    originalHadRepresentative = false,
    fulfillmentTypes = [],
    originalFulfillmentTypes = [],
    originalVisitLocation = null,
  } = {},
) {
  if (editing && (!Number.isSafeInteger(version) || version < 0))
    throw new Error('최신 이미지 버전을 확인해 주세요.')
  if (!Array.isArray(draft.details) || draft.details.length > 5)
    throw new Error('상세 이미지는 최대 5장입니다.')
  const representativeAssetId = draft.representative
    ? requireAssetId(draft.representative.assetId)
    : null
  if (!representativeAssetId && (!editing || originalHadRepresentative))
    throw new Error('대표 이미지를 등록해 주세요.')
  const detailImages = draft.details.map((image) => {
    if (typeof image.altText !== 'string')
      throw new Error('이미지 설명을 확인해 주세요.')
    const altText = image.altText.trim()
    if (Array.from(altText).length > 200)
      throw new Error('이미지 설명은 200자 이내로 입력해 주세요.')
    return { assetId: requireAssetId(image.assetId), altText: altText || null }
  })
  const ids = [
    representativeAssetId,
    ...detailImages.map((image) => image.assetId),
  ].filter(Boolean)
  if (new Set(ids).size !== ids.length)
    throw new Error('대표와 상세 이미지에 같은 자산을 중복 사용할 수 없습니다.')
  const visitLocation = visitLocationRequest(draft, {
    editing,
    originalFulfillmentTypes,
    originalVisitLocation,
    fulfillmentTypes,
  })
  return {
    ...(editing ? { expectedPresentationVersion: version } : {}),
    presentation: {
      representativeAssetId,
      detailImages,
      ...(visitLocation === undefined ? {} : { visitLocation }),
    },
  }
}
// 표시 버전과 상세 배열, 자산 ID의 형식·중복을 검사합니다. 불완전한 응답으로 편집 초안을 만들지 않습니다.
export function validateManagedPresentation(data) {
  if (
    !data ||
    !Number.isSafeInteger(data.version) ||
    data.version < 0 ||
    !Array.isArray(data.detailImages) ||
    data.detailImages.length > 5
  )
    throw new Error('이미지 관리 응답을 확인할 수 없습니다.')
  const images = [data.representativeImage, ...data.detailImages].filter(
    Boolean,
  )
  const ids = images.map((image) => requireAssetId(image.assetId))
  if (new Set(ids).size !== ids.length)
    throw new Error('이미지 관리 응답에 중복 자산이 있습니다.')
  return data
}

// 관리 DTO만 입력합니다. 과거 URL을 자산 ID로 변환하지 않습니다.
export function mediaDraftFromManaged(response) {
  const data = validateManagedPresentation(response)
  const image = (item) =>
    item
      ? {
          key: requireAssetId(item.assetId),
          assetId: requireAssetId(item.assetId),
          altText: item.altText ?? '',
          status: 'existing',
        }
      : null
  return {
    representative: image(data.representativeImage),
    details: data.detailImages.map(image),
    location: data.visitLocation ? { ...data.visitLocation } : null,
    locationConfirmed: false,
  }
}

// 참여 방식이 달라지면 주소 공개 확인을 해제하지만 작성 주소는 보존합니다.
export function changeMediaFulfillment(draft, previous, next) {
  return previous.includes('VISIT') === next.includes('VISIT')
    ? draft
    : { ...draft, locationConfirmed: false }
}

// 기존 configured 본문을 유지한 채 표시정보를 합칩니다.
// 폼을 이번에 수정하지 않았다면 기존 참여 방식을 사용해 주소 전송 의미를 판단합니다.
export function withCampaignPresentation(
  payload,
  draft,
  { managed, originalFulfillmentTypes = [], editing = false } = {},
) {
  if (editing) validateManagedPresentation(managed)
  const fulfillmentTypes =
    payload.applicationForm?.allowedFulfillmentTypes || originalFulfillmentTypes
  return {
    ...payload,
    ...presentationRequest(draft, {
      editing,
      version: managed?.version,
      originalHadRepresentative: Boolean(managed?.representativeImage),
      originalVisitLocation: managed?.visitLocation,
      originalFulfillmentTypes,
      fulfillmentTypes,
    }),
  }
}

// 이미지만 바꾸고 기존 방문 주소가 같으면 주소 키를 생략해 현재 값을 유지합니다.
// 배송형은 null, 신규·수정한 방문 주소는 명시적으로 확인된 객체를 보내며 이전 비활성 주소를 자동 공개하지 않습니다.
function visitLocationRequest(
  draft,
  {
    editing = false,
    originalFulfillmentTypes = [],
    originalVisitLocation = null,
    fulfillmentTypes = [],
  },
) {
  let visitLocation = null
  const addressKeys = ['venueName', 'postalCode', 'address1', 'address2']
  const unchangedAddress = originalVisitLocation
    ? addressKeys.every(
        (key) =>
          String(draft.location?.[key] ?? '').trim() ===
          String(originalVisitLocation[key] ?? '').trim(),
      )
    : !Object.values(draft.location || {}).some((value) =>
        String(value ?? '').trim(),
      )
  const preserveLocation =
    editing &&
    originalFulfillmentTypes.includes('VISIT') &&
    !draft.locationConfirmed &&
    unchangedAddress
  if (fulfillmentTypes.includes('VISIT') && preserveLocation) {
    visitLocation = undefined
  } else if (fulfillmentTypes.includes('VISIT')) {
    if (!draft.locationConfirmed)
      throw new Error('공개 방문 주소를 확인해 주세요.')
    const location = validateVisitLocationInput(draft.location)
    visitLocation = {
      ...location,
      postalCode: location.postalCode || null,
      address2: location.address2 || null,
    }
  }
  return visitLocation
}

// 아직 자산 ID가 없는 파일도 업로드 전에 필수 대표·파일·설명·주소를 검사합니다.
// 입력 오류 때문에 불필요한 업로드나 저장 잠금이 시작되지 않도록 편집기가 먼저 호출합니다.
export function validatePendingMedia(draft, options = {}) {
  if (
    !draft.representative &&
    (!options.editing || options.originalHadRepresentative)
  )
    throw new Error('대표 이미지를 등록해 주세요.')
  if (!Array.isArray(draft.details) || draft.details.length > 5)
    throw new Error('상세 이미지는 최대 5장입니다.')
  const images = [draft.representative, ...draft.details].filter(Boolean)
  const assetIds = []
  for (const image of images) {
    if (image.assetId) assetIds.push(requireAssetId(image.assetId))
    else validateCampaignImageFile(image.file)
  }
  if (new Set(assetIds).size !== assetIds.length)
    throw new Error('같은 이미지를 중복 사용할 수 없습니다.')
  for (const image of draft.details) {
    if (
      typeof image.altText !== 'string' ||
      Array.from(image.altText.trim()).length > 200
    )
      throw new Error('이미지 설명은 200자 이내로 입력해 주세요.')
  }
  visitLocationRequest(draft, options)
}
