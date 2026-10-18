/**
 * 관리 응답과 인증된 blob을 초안으로 읽고 새 파일만 업로드한 뒤 저장 요청에 합칩니다.
 * 이미 자산 ID가 있는 항목은 다시 업로드하지 않으며 실패는 편집기의 재조회 잠금으로 전달합니다.
 */
import {
  mediaDraftFromManaged,
  withCampaignPresentation,
} from './campaignMediaContract.js'

// 자산 참조를 관리 API에서 읽고 각 이미지는 소유자 인증 preview로 받아 표시용 blob을 채웁니다.
export async function readMediaSession(api, campaignId) {
  if (!api) return null
  const managed = await api.manage(campaignId)
  const draft = mediaDraftFromManaged(managed)
  async function preview(image) {
    return image ? { ...image, file: await api.preview(image.assetId) } : null
  }
  const [representative, details] = await Promise.all([
    preview(draft.representative),
    Promise.all(draft.details.map(preview)),
  ])
  return { managed, draft: { ...draft, representative, details } }
}

// 실패는 편집기의 재조회 잠금으로 전달합니다. 자동 재시도하지 않습니다.
export async function prepareMediaSave(
  api,
  payload,
  session,
  options,
  onProgress = () => {},
) {
  if (!api) return payload
  let draft = session.draft
  // 이미 자산 ID가 있는 이미지는 재사용합니다. 새 파일만 업로드하고 성공한 ID를 다음 저장 요청에 사용합니다.
  async function upload(image) {
    if (!image || image.assetId) return image
    const asset = await api.upload(image.file)
    return { ...image, assetId: asset.assetId, status: 'uploaded' }
  }
  draft = { ...draft, representative: await upload(draft.representative) }
  onProgress(draft)
  // 상세 파일을 순서대로 처리하고 성공할 때마다 초안에 반영합니다.
  // 중간 실패 시 이후 파일을 자동 전송하지 않으며 캠페인 저장도 호출부에서 중단됩니다.
  for (let index = 0; index < draft.details.length; index++) {
    const image = await upload(draft.details[index])
    draft = {
      ...draft,
      details: draft.details.map((item, i) => (i === index ? image : item)),
    }
    onProgress(draft)
  }
  return withCampaignPresentation(payload, draft, {
    ...options,
    managed: session.managed,
  })
}
