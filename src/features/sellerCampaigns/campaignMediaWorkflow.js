import {
  mediaDraftFromManaged,
  withCampaignPresentation,
} from './campaignMediaContract.js'

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
  async function upload(image) {
    if (!image || image.assetId) return image
    const asset = await api.upload(image.file)
    return { ...image, assetId: asset.assetId, status: 'uploaded' }
  }
  draft = { ...draft, representative: await upload(draft.representative) }
  onProgress(draft)
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
