// 점검용 캠페인·신청을 API로 빠르게 만드는 도구입니다(화면 점검의 준비 단계용).
import fs from 'node:fs'
import { api, call } from './e2e-lib.mjs'

const pad = (n) => String(n).padStart(2, '0')
export const local = (d, seconds = true) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}${seconds ? ':00' : ''}`
export const hoursFromNow = (h) => new Date(Date.now() + h * 3600_000)
const image = new URL(
  '../../public/assets/discovery/banners/review.png',
  import.meta.url,
).pathname

// 대표 이미지를 올리고 캠페인·신청서를 한 번에 만듭니다.
export async function createCampaign(
  brand,
  {
    title,
    type = 'PRODUCT',
    fulfillment = 'DELIVERY',
    recruit = 2,
    details = {},
    questions = [],
  },
) {
  const body = new FormData()
  body.append(
    'file',
    new Blob([fs.readFileSync(image)], { type: 'image/png' }),
    'review.png',
  )
  const upload = await fetch(`${api}/campaign-image-assets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${brand.accessToken}` },
    body,
  })
  const asset = await upload.json()
  const res = await call(brand, 'POST', '/campaigns/configured', {
    campaign: {
      selectionMode: 'BRAND_DIRECT',
      title,
      description: '기능 점검용 캠페인입니다.',
      category: '뷰티',
      campaignType: type,
      region: type === 'LOCAL' ? '서울' : null,
      contentChannel: 'INSTAGRAM',
      recruitmentCount: recruit,
      rewardDescription: '점검용 제공 내역',
      startAt: local(hoursFromNow(-1)),
      endAt: local(hoursFromNow(2)),
      minFollowerCount: 0,
      details,
    },
    applicationForm: {
      allowedFulfillmentTypes: [fulfillment],
      questions,
      agreements: [],
    },
    requirementMode: 'NONE',
    requirement: null,
    presentation: { representativeAssetId: asset.assetId, detailImages: [] },
  })
  if (!res.data?.campaign?.id)
    throw new Error(
      `캠페인 생성 실패 ${res.status} ${JSON.stringify(res.data)}`,
    )
  return res.data.campaign.id
}

// 배송형 신청을 넣고 신청 ID를 돌려줍니다.
export async function applyDelivery(user, campaignId, name = '점검사용자') {
  const form = (
    await call(user, 'GET', `/campaigns/${campaignId}/application-form`)
  ).data
  await call(user, 'POST', `/campaigns/${campaignId}/applications`, {
    message: '점검용 신청입니다.',
    expectedFormVersion: form.version,
    expectedEligibilityRequirementId: null,
    expectedEligibilityRequirementVersion: null,
    fulfillmentType: 'DELIVERY',
    shippingContact: {
      recipientName: name,
      recipientPhone: '010-0000-0000',
      postalCode: '04524',
      address1: '서울특별시 중구 세종대로 110',
      address2: '3층',
    },
    answers: [],
    agreementAcceptances: [],
  })
  const mine = (await call(user, 'GET', '/campaigns/applications/mine')).data
  return mine.find((a) => String(a.campaignId) === String(campaignId))?.id
}
