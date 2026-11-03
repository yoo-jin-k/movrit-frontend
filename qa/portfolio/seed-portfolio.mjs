// 포트폴리오 캡처·시연 영상용 데이터를 만듭니다(통합 DB 전용).
//
// - 계정: 업체 '루미 스튜디오'(브랜드 4개)와 참여자 3명. 비밀번호 해시는 기존 점검 계정(demo-brand)과 같게 둡니다.
// - 캠페인 5개와 신청·선정·배송·콘텐츠·구매 인증·방문 예약·채팅·커뮤니티 글을 실제 API로 진행해 둡니다.
// - 이미 만든 데이터가 있으면 건너뜁니다(여러 번 실행해도 같은 결과).
// - 마지막에 seed-catalog.mjs 로 업체 6곳·참여자 5명·캠페인 39개·커뮤니티 글을 더 채웁니다(목록 화면을 골고루 보이게).
//
// 실행: MOVRIT_QA_PASSWORD=... node qa/portfolio/seed-portfolio.mjs
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { api, call, login } from '../e2e/e2e-lib.mjs'
import { seedCatalog } from './seed-catalog.mjs'

const PSQL =
  process.env.MOVRIT_PSQL ||
  '/Applications/Postgres.app/Contents/Versions/latest/bin/psql'
const DB = process.env.MOVRIT_DB || 'movrit_integration'
const sql = (query) =>
  execFileSync(
    PSQL,
    ['-h', 'localhost', '-U', 'movrit_user', '-d', DB, '-tA', '-c', query],
    { encoding: 'utf8' },
  ).trim()
const banner = (name) =>
  new URL(`../../public/assets/discovery/banners/${name}`, import.meta.url)
    .pathname
const pad = (n) => String(n).padStart(2, '0')
const at = (days, hour = 10) => {
  const d = new Date(Date.now() + days * 86400_000)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:00:00`
}
const log = (...args) => console.log('·', ...args)

// ───────── 1) 계정·업체·브랜드 (SQL) ─────────
const hash = sql(
  `select password_hash from member where email = 'demo-brand@movrit.local'`,
)
if (!hash)
  throw new Error(
    'demo-brand 계정이 없습니다. 기본 점검 계정을 먼저 준비해 주세요.',
  )
const members = [
  ['lumi.studio@movrit.local', '정다온', '루미스튜디오'],
  ['haneul@movrit.local', '김하늘', '하늘기록'],
  ['minji@movrit.local', '이민지', '민지데일리'],
  ['junho@movrit.local', '박준호', '준호리뷰'],
]
for (const [email, name, nickname] of members)
  sql(`insert into member (email, password_hash, name, nickname, role, status, email_verified_at, created_at, updated_at)
       values ('${email}', '${hash}', '${name}', '${nickname}', 'USER', 'ACTIVE', now(), now(), now())
       on conflict (email) do nothing`)
const metrics = [
  ['haneul@movrit.local', 'INSTAGRAM', 12400],
  ['minji@movrit.local', 'INSTAGRAM', 3200],
  ['minji@movrit.local', 'BLOG', 860],
  ['junho@movrit.local', 'YOUTUBE', 8900],
]
for (const [email, channel, value] of metrics)
  sql(`insert into member_channel_metric (member_id, channel_type, metric_type, metric_value, measurement_period, measured_at, verification_status, created_at, updated_at)
       select id, '${channel}', 'FOLLOWER_COUNT', ${value}, null, now(), 'VERIFIED', now(), now() from member where email = '${email}'
       on conflict (member_id, channel_type, metric_type) do nothing`)
sql(`insert into seller_profile (member_id, business_name, brand_name, business_number, representative_name, status, created_at, updated_at)
     select id, '루미 스튜디오', '루미 스킨랩', 'DEMO-LUMI-STUDIO', '정다온', 'APPROVED', now(), now()
     from member where email = 'lumi.studio@movrit.local' on conflict (member_id) do nothing`)
const brands = [
  ['루미 스킨랩', '저자극 스킨케어를 만드는 뷰티 브랜드입니다.'],
  ['오월 키친', '제철 재료로 요리하는 다이닝·카페 브랜드입니다.'],
  ['결 홈', '공간의 결을 살리는 홈 프래그런스 브랜드입니다.'],
  ['머무름 스테이', '제주 돌담 마을의 독채 숙소입니다.'],
]
for (const [name, description] of brands)
  sql(`insert into brand (seller_id, name, description, status, created_at, updated_at)
       select s.id, '${name}', '${description}', 'ACTIVE', now(), now() from seller_profile s
       where s.business_number = 'DEMO-LUMI-STUDIO'
         and not exists (select 1 from brand b where b.seller_id = s.id and b.name = '${name}')`)
const brandId = (name) =>
  Number(
    sql(`select b.id from brand b join seller_profile s on s.id = b.seller_id
         where s.business_number = 'DEMO-LUMI-STUDIO' and b.name = '${name}'`),
  )

const studio = await login('lumi.studio@movrit.local')
const haneul = await login('haneul@movrit.local')
const minji = await login('minji@movrit.local')
const junho = await login('junho@movrit.local')
const admin = await login('demo-admin@movrit.local')
log('계정 준비 완료')

// ───────── 2) 캠페인 ─────────
async function upload(file) {
  const body = new FormData()
  body.append(
    'file',
    new Blob([fs.readFileSync(banner(file))], { type: 'image/png' }),
    file,
  )
  const res = await fetch(`${api}/campaign-image-assets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studio.accessToken}` },
    body,
  })
  return (await res.json()).assetId
}
const existing = async () =>
  (await call(studio, 'GET', '/collaborations/campaigns/seller')).data
async function campaign(spec) {
  const found = (await existing()).find((c) => c.title === spec.title)
  if (found) return found.id
  const ends = spec.endsIn ?? 6
  const res = await call(studio, 'POST', '/campaigns/configured', {
    campaign: {
      selectionMode: 'BRAND_DIRECT',
      brandId: brandId(spec.brand),
      preorderId: null,
      title: spec.title,
      description: spec.description,
      category: spec.category,
      campaignType: spec.type,
      region: spec.region || null,
      contentChannel: spec.channel,
      recruitmentCount: spec.recruit,
      rewardDescription: spec.reward,
      startAt: at(-2, 9),
      endAt: at(ends, 23),
      minFollowerCount: 0,
      details: {
        mission: spec.mission,
        channelGuide: spec.channelGuide,
        submissionRequirement: spec.requirement,
        deliveryGuide:
          spec.fulfillment === 'DELIVERY'
            ? '선정 후 3일 안에 발송하며, 송장번호는 알림과 내 캠페인에서 확인할 수 있습니다.'
            : null,
        visitGuide:
          spec.fulfillment === 'VISIT'
            ? '방문 희망 일시를 예약 요청해 주시면 확인 후 확정해 드립니다.'
            : null,
        caution:
          '제공받은 제품·서비스는 다른 사람에게 판매하거나 양도할 수 없습니다. 콘텐츠에 #협찬 표기를 꼭 넣어 주세요.',
        selectionAnnouncedAt: at(ends + 1, 12),
        experienceStartAt: at(ends + 2, 9),
        experienceEndAt: at(ends + 12, 23),
        contentSubmissionStartAt: at(ends + 2, 9),
        contentSubmissionEndAt: at(ends + 16, 23),
        resultsAnnouncedAt: at(ends + 18, 12),
      },
    },
    applicationForm: {
      allowedFulfillmentTypes: [spec.fulfillment],
      questions: spec.questions || [],
      agreements: [
        {
          id: 'content-guide',
          title: '콘텐츠 작성 안내 동의',
          version: '1',
          required: true,
          body: '체험 후 정해진 기간 안에 콘텐츠를 올리고, 브랜드가 콘텐츠를 홍보에 쓰는 것에 동의합니다.',
        },
      ],
    },
    requirementMode: 'NONE',
    requirement: null,
    presentation: {
      representativeAssetId: await upload(spec.image),
      detailImages: [],
      ...(spec.fulfillment === 'VISIT' ? { visitLocation: spec.location } : {}),
    },
  })
  if (!res.data?.campaign?.id)
    throw new Error(
      `캠페인 생성 실패: ${spec.title} ${JSON.stringify(res.data)}`,
    )
  if (spec.purchase)
    await call(
      studio,
      'PUT',
      `/campaigns/${res.data.campaign.id}/purchase-review`,
      spec.purchase,
    )
  log('캠페인 생성', spec.title)
  return res.data.campaign.id
}

const ampoule = await campaign({
  brand: '루미 스킨랩',
  title: '시카 수분 앰플 2주 사용 후기 체험단',
  description:
    '건조하고 예민한 피부를 위한 시카 수분 앰플을 2주 동안 써 보고, 사용 전후 피부 변화를 솔직하게 기록해 주실 분을 찾습니다.',
  category: '뷰티',
  type: 'PRODUCT',
  fulfillment: 'DELIVERY',
  channel: 'INSTAGRAM',
  recruit: 3,
  reward: '시카 수분 앰플 30ml 1개 (정가 32,000원)',
  image: 'clip.png',
  mission:
    '아침·저녁 세안 후 2~3방울을 2주 동안 사용하고, 1일차와 14일차 피부 결 사진을 비교해 주세요.',
  channelGuide:
    '인스타그램 피드에 사진 3장 이상, 사용감과 흡수력 위주로 작성해 주세요.',
  requirement: '필수 태그: @lumi.skinlab #루미스킨랩 #시카앰플 #협찬',
  questions: [
    {
      id: 'skin',
      label: '피부 타입을 알려 주세요',
      required: true,
      type: 'SINGLE_CHOICE',
      options: ['건성', '지성', '복합성', '민감성'],
      maxLength: null,
    },
  ],
})
const dinner = await campaign({
  brand: '오월 키친',
  title: '오월 그릴 2인 디너 코스 방문 체험',
  description:
    '성수동 오월 그릴의 제철 디너 코스를 2인으로 즐기고, 공간과 메뉴를 블로그에 소개해 주세요.',
  category: '맛집',
  type: 'LOCAL',
  region: '서울',
  fulfillment: 'VISIT',
  channel: 'BLOG',
  recruit: 2,
  reward: '2인 디너 코스 (12만 원 상당)',
  image: 'dining.png',
  mission: '평일 저녁에 방문해 코스 요리 사진과 매장 분위기를 담아 주세요.',
  channelGuide: '네이버 블로그에 사진 15장 이상, 지도 첨부를 부탁드립니다.',
  requirement: '제목에 "성수 오월 그릴"을 넣어 주세요. #협찬 표기 필수',
  location: {
    venueName: '오월 그릴 성수점',
    postalCode: '04781',
    address1: '서울특별시 성동구 연무장길 12',
    address2: '2층',
  },
})
const coffee = await campaign({
  brand: '오월 키친',
  title: '콜드브루 원두 구매평 캠페인',
  description:
    '오월 키친 스마트스토어에서 콜드브루 원두를 구매하고 포토 구매평을 남겨 주시면, 구매평 승인 후 결제 금액 대부분을 돌려드립니다.',
  category: '식품',
  type: 'PURCHASE_REVIEW',
  fulfillment: 'PURCHASE',
  channel: 'OTHER',
  recruit: 10,
  reward: '구매평 승인 후 15,000원 환급',
  image: 'review.png',
  mission:
    '원두를 구매해 2회 이상 내려 마신 뒤, 맛과 향에 대한 포토 구매평을 남겨 주세요.',
  channelGuide: '구매처 상품 페이지의 포토 구매평으로 작성해 주세요.',
  requirement: '사진 2장 이상, 100자 이상',
  purchase: {
    storeName: '네이버 스마트스토어',
    productUrl: 'https://smartstore.naver.com/owol-kitchen/products/1001',
    productPrice: 18900,
    paybackAmount: 15000,
    purchaseGuide:
      "옵션은 '홀빈 200g'으로 구매해 주세요. 구매평에는 사진 2장 이상을 올려 주세요.",
  },
})
const mist = await campaign({
  brand: '결 홈',
  title: '패브릭 미스트 공간 리뷰 체험단',
  description:
    '침구와 소파에 뿌리는 패브릭 미스트를 사용해 보고, 우리 집 분위기와 향을 영상으로 담아 주세요.',
  category: '생활',
  type: 'PRODUCT',
  fulfillment: 'DELIVERY',
  channel: 'CLIP',
  recruit: 5,
  reward: '패브릭 미스트 200ml 2종',
  image: 'living.png',
  mission:
    '향이 가장 잘 어울리는 공간에서 15초 이상의 짧은 영상을 찍어 주세요.',
  channelGuide: '네이버 클립 또는 인스타그램 릴스로 올려 주세요.',
  requirement: '영상 15초 이상, 향 이름(코튼·우디) 언급',
})
const stay = await campaign({
  brand: '머무름 스테이',
  title: '제주 돌담 독채 1박 숙박 체험',
  description:
    '제주 구좌읍 돌담 마을의 독채 숙소에서 1박을 머물며, 숙소의 낮과 밤을 기록해 주실 분을 찾습니다.',
  category: '숙박',
  type: 'LOCAL',
  region: '제주',
  fulfillment: 'VISIT',
  channel: 'INSTAGRAM',
  recruit: 1,
  reward: '독채 1박 (2인, 주중)',
  image: 'travel.png',
  endsIn: 1,
  mission: '체크인부터 체크아웃까지 숙소 곳곳을 사진과 영상으로 담아 주세요.',
  channelGuide: '인스타그램 피드 1개 + 스토리 3개 이상',
  requirement: '숙소 계정 태그와 위치 태그 필수',
  location: {
    venueName: '머무름 스테이',
    postalCode: '63358',
    address1: '제주특별자치도 제주시 구좌읍 해맞이해안로 100',
    address2: null,
  },
})

// ───────── 3) 신청·선정·진행 ─────────
async function apply(user, campaignId, fulfillment, extra = {}) {
  const mine = (await call(user, 'GET', '/campaigns/applications/mine')).data
  const found = mine.find((a) => a.campaignId === campaignId)
  if (found) return found.id
  const form = (
    await call(user, 'GET', `/campaigns/${campaignId}/application-form`)
  ).data
  const res = await call(
    user,
    'POST',
    `/campaigns/${campaignId}/applications`,
    {
      message:
        extra.message ||
        '평소 관심 있던 브랜드라 꼭 참여해 보고 싶습니다. 꼼꼼하게 기록하겠습니다.',
      expectedFormVersion: form.version,
      expectedEligibilityRequirementId: null,
      expectedEligibilityRequirementVersion: null,
      fulfillmentType: fulfillment,
      shippingContact:
        fulfillment === 'DELIVERY'
          ? {
              recipientName: extra.name,
              recipientPhone: extra.phone,
              postalCode: '06236',
              address1: extra.address,
              address2: extra.address2,
            }
          : null,
      answers: extra.answers || [],
      agreementAcceptances: form.agreements.map((a) => ({
        agreementId: a.id,
        version: a.version,
        accepted: true,
      })),
    },
  )
  if (res.status !== 201)
    throw new Error(`신청 실패 ${res.status} ${JSON.stringify(res.data)}`)
  return res.data.id
}
const statusOf = async (user, id) =>
  (await call(user, 'GET', '/campaigns/applications/mine')).data.find(
    (a) => a.id === id,
  )?.status
const select = async (id) =>
  call(studio, 'PATCH', `/campaigns/applications/${id}/select`)

// 앰플: 3명 신청 → 2명 선정 → 배송 → 하늘 완료(평가까지), 민지 콘텐츠 제출, 준호 접수 대기
const skin = (v) => [{ questionId: 'skin', value: v }]
const aHaneul = await apply(haneul, ampoule, 'DELIVERY', {
  name: '김하늘',
  phone: '010-2481-3572',
  address: '서울특별시 강남구 테헤란로 152',
  address2: '1203호',
  answers: skin('복합성'),
  message:
    '환절기마다 볼이 건조해져서 수분 앰플을 찾고 있었어요. 14일 동안 같은 조명에서 비교 사진을 찍어 올리겠습니다.',
})
const aMinji = await apply(minji, ampoule, 'DELIVERY', {
  name: '이민지',
  phone: '010-3920-1184',
  address: '서울특별시 마포구 와우산로 94',
  address2: '302호',
  answers: skin('민감성'),
})
await apply(junho, ampoule, 'DELIVERY', {
  name: '박준호',
  phone: '010-7731-5520',
  address: '경기도 성남시 분당구 정자일로 95',
  address2: '1801호',
  answers: skin('지성'),
})
if ((await statusOf(haneul, aHaneul)) === 'SUBMITTED')
  await call(studio, 'PATCH', '/campaigns/applications/bulk', {
    applicationIds: [aHaneul, aMinji],
    action: 'select',
  })
// 앰플 캠페인은 '진행 중' 단계(모집 종료 → 체험·콘텐츠 제출 기간)로 보여주기 위해,
// 신청을 받은 뒤 일정을 지난 날짜 기준으로 옮깁니다(시연 데이터 전용).
sql(`update collaboration_campaign set
       start_at = date_trunc('hour', now()) - interval '14 day',
       end_at = date_trunc('hour', now()) - interval '8 day',
       selection_announced_at = date_trunc('hour', now()) - interval '7 day',
       experience_start_at = date_trunc('hour', now()) - interval '6 day',
       experience_end_at = date_trunc('hour', now()) + interval '6 day',
       content_submission_start_at = date_trunc('hour', now()) - interval '5 day',
       content_submission_end_at = date_trunc('hour', now()) + interval '8 day',
       results_announced_at = date_trunc('hour', now()) + interval '10 day'
     where id = ${ampoule} and end_at > now()`)
await call(studio, 'PUT', `/campaigns/${ampoule}/shipping`, {
  shipments: [
    {
      applicationId: aHaneul,
      courier: 'CJ대한통운',
      trackingNumber: '689812345678',
    },
    {
      applicationId: aMinji,
      courier: 'CJ대한통운',
      trackingNumber: '689812345679',
    },
  ],
})
for (const [user, id] of [
  [haneul, aHaneul],
  [minji, aMinji],
])
  if ((await statusOf(user, id)) === 'ACTIVE')
    await call(
      user,
      'PATCH',
      `/campaigns/applications/${id}/experience-confirm`,
    )
async function submit(user, id, url, note) {
  if ((await statusOf(user, id)) !== 'ACTIVE') return
  await call(user, 'POST', `/campaign-contents/applications/${id}/links`, {
    links: [{ channelType: 'INSTAGRAM', contentUrl: url }],
    note,
  })
}
await submit(
  haneul,
  aHaneul,
  'https://www.instagram.com/p/HaneulCica14/',
  '1일차와 14일차 비교 사진을 넣었습니다.',
)
await submit(
  minji,
  aMinji,
  'https://www.instagram.com/p/MinjiDailyCica/',
  '민감성 피부 기준으로 작성했어요.',
)
// 하늘: 업체 검토 완료 → 운영자 최종 승인 → 평가
const contents = (await call(studio, 'GET', '/campaign-contents/seller')).data
const haneulContent = (
  Array.isArray(contents) ? contents : contents.content || []
).find((c) => c.applicationId === aHaneul)
if (haneulContent && haneulContent.status === 'SUBMITTED')
  await call(
    studio,
    'PATCH',
    `/campaign-contents/${haneulContent.id}/approve`,
    {
      comment: '사진 구성이 좋아요. 비교 컷이 특히 잘 보입니다.',
      expectedVersion: haneulContent.version,
    },
  )
// 민지: 업체 검토까지만 끝내 운영자 '최종 승인 대기' 목록에 남겨 둡니다.
const minjiContent = (
  Array.isArray(contents) ? contents : contents.content || []
).find((c) => c.applicationId === aMinji)
if (minjiContent && minjiContent.status === 'SUBMITTED')
  await call(studio, 'PATCH', `/campaign-contents/${minjiContent.id}/approve`, {
    comment: '민감성 피부 관점이 잘 드러나요. 확인했습니다.',
    expectedVersion: minjiContent.version,
  })
const adminList = (await call(admin, 'GET', '/admin/campaign-contents')).data
const adminItem = (
  Array.isArray(adminList) ? adminList : adminList.content || []
).find((c) => c.applicationId === aHaneul)
if (adminItem && adminItem.status === 'BRAND_APPROVED')
  await call(
    admin,
    'PATCH',
    `/admin/campaign-contents/${adminItem.id}/approve`,
    {
      comment: '가이드에 맞게 작성되었습니다.',
      expectedVersion: adminItem.version,
    },
  )
if ((await statusOf(haneul, aHaneul)) === 'COMPLETED')
  await call(studio, 'PUT', `/campaigns/applications/${aHaneul}/rating`, {
    rating: 5,
    memo: '마감 3일 전 제출, 비교 사진 품질이 좋음. 다음 신제품 때 우선 연락',
  })

// 콘텐츠 성과: 하늘은 이틀치(전날·오늘), 민지는 오늘 하루치를 기록해 둡니다.
// 같은 날짜는 고쳐 쓰므로 여러 번 실행해도 결과가 같습니다. 제출일보다 이른 날짜는 서버가 거절하므로 건너뜁니다.
const dayIso = (offset) => at(offset).slice(0, 10)
async function metric(user, submissionId, url, offset, views, likes, comments) {
  await call(user, 'PUT', `/campaign-contents/${submissionId}/metrics`, {
    contentUrl: url,
    viewCount: views,
    likeCount: likes,
    commentCount: comments,
    measuredOn: dayIso(offset),
  })
}
if (haneulContent) {
  const url = 'https://www.instagram.com/p/HaneulCica14/'
  await metric(haneul, haneulContent.id, url, -1, 1840, 126, 14)
  await metric(haneul, haneulContent.id, url, 0, 2630, 171, 19)
}
if (minjiContent) {
  await metric(
    studio,
    minjiContent.id,
    'https://www.instagram.com/p/MinjiDailyCica/',
    0,
    940,
    58,
    7,
  )
}

// 디너: 하늘 선정 → 방문 예약 확정, 준호 접수 대기
const vHaneul = await apply(haneul, dinner, 'VISIT', {
  message:
    '성수 맛집 블로그를 3년째 운영하고 있습니다. 코스 흐름이 잘 보이게 사진을 정리하겠습니다.',
})
await apply(junho, dinner, 'VISIT')
if ((await statusOf(haneul, vHaneul)) === 'SUBMITTED') await select(vHaneul)
const reservation = await call(
  haneul,
  'GET',
  `/campaigns/applications/${vHaneul}/visit-reservation`,
)
if (reservation.status === 204) {
  await call(
    haneul,
    'POST',
    `/campaigns/applications/${vHaneul}/visit-reservation`,
    {
      visitAt: at(9, 19),
      partySize: 2,
      note: '창가 자리가 가능하면 부탁드립니다.',
    },
  )
  await call(
    studio,
    'PATCH',
    `/campaigns/applications/${vHaneul}/visit-reservation/confirm`,
  )
}

// 원두 구매평: 민지 선정 → 구매 인증
const pMinji = await apply(minji, coffee, 'PURCHASE')
if ((await statusOf(minji, pMinji)) === 'SUBMITTED') await select(pMinji)
const proof = await call(
  minji,
  'GET',
  `/campaigns/applications/${pMinji}/purchase-proof`,
)
if (proof.status === 204) {
  const body = new FormData()
  body.append('orderNumber', '2026110312345678')
  body.append('paidAmount', '18900')
  body.append(
    'evidence',
    new Blob([fs.readFileSync(banner('review.png'))], { type: 'image/png' }),
    'order.png',
  )
  await fetch(`${api}/campaigns/applications/${pMinji}/purchase-proof`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${minji.accessToken}` },
    body,
  })
}

// 패브릭 미스트: 준호 접수 대기(시연 때 다른 참여자가 새로 신청합니다)
await apply(junho, mist, 'DELIVERY', {
  name: '박준호',
  phone: '010-7731-5520',
  address: '경기도 성남시 분당구 정자일로 95',
  address2: '1801호',
})
log('신청·진행 준비 완료')

// ───────── 4) 채팅·커뮤니티 ─────────
const room = (await call(studio, 'POST', `/chats/applications/${aHaneul}`)).data
const roomMessages = (await call(studio, 'GET', `/chats/${room.id}/messages`))
  .data.messages
if (!roomMessages.length) {
  const talk = [
    [
      studio,
      '하늘기록님 안녕하세요, 루미 스킨랩입니다. 오늘 오후 CJ대한통운으로 발송했어요!',
    ],
    [haneul, '감사합니다! 받으면 바로 1일차 사진부터 찍어 둘게요.'],
    [studio, '촬영할 때 자연광에서 찍어 주시면 앰플 제형이 더 잘 보여요.'],
    [haneul, '네, 오전 창가에서 찍어 보겠습니다 :)'],
  ]
  for (const [user, body] of talk)
    await call(user, 'POST', `/chats/${room.id}/messages`, { body })
  const photo = new FormData()
  photo.append(
    'file',
    new Blob([fs.readFileSync(banner('clip.png'))], { type: 'image/png' }),
    '제품컷_참고.png',
  )
  photo.append('body', '참고용 제품 사진 보내 드려요.')
  await fetch(`${api}/chats/${room.id}/attachments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studio.accessToken}` },
    body: photo,
  })
}
const posts = (await call(haneul, 'GET', '/community/posts?board=free')).data
if (
  !(posts.items || []).some((p) => p.title.startsWith('체험단 처음이신 분들'))
) {
  const post = (
    await call(haneul, 'POST', '/community/posts', {
      board: 'free',
      category: '정보공유',
      title: '체험단 처음이신 분들께 드리는 작은 팁',
      body: '1. 신청 메시지는 내 채널과 캠페인이 어떻게 맞는지 구체적으로 적어요.\n2. 선정되면 일정표에서 콘텐츠 마감일부터 확인해요.\n3. 사진은 받자마자 개봉 전 컷부터 찍어 두면 편해요.\n\n다들 즐거운 체험 되세요!',
    })
  ).data
  await call(minji, 'POST', `/community/posts/${post.id}/comments`, {
    body: '개봉 전 컷 꿀팁이네요. 저장해 둘게요!',
  })
}
// 신고 처리 화면용: 홍보 계정이 단 광고 댓글을 두 사람이 신고해 둡니다(운영자 '접수' 상태).
sql(`insert into member (email, password_hash, name, nickname, role, status, email_verified_at, created_at, updated_at)
     values ('freebie.tip@movrit.local', '${hash}', '홍보계정', '체험단꿀정보', 'USER', 'ACTIVE', now(), now(), now())
     on conflict (email) do nothing`)
const spammer = await login('freebie.tip@movrit.local')
const tipPost = (
  await call(haneul, 'GET', '/community/posts?board=free')
).data.items.find((p) => p.title.startsWith('체험단 처음이신 분들'))
const tipComments = (
  await call(haneul, 'GET', `/community/posts/${tipPost.id}`)
).data.comments
let spam = (tipComments || []).find((c) => c.body?.includes('오픈채팅'))
if (!spam)
  spam = (
    await call(spammer, 'POST', `/community/posts/${tipPost.id}/comments`, {
      body: '체험단 100% 선정되는 비법 알려드려요. 오픈채팅에서 "체험꿀팁" 검색해서 들어오세요!',
    })
  ).data
const reported = (await call(admin, 'GET', '/admin/content-reports')).data
const reportList = Array.isArray(reported) ? reported : reported.content || []
if (
  spam?.id &&
  !reportList.some(
    (r) => r.targetType === 'COMMUNITY_COMMENT' && r.targetId === spam.id,
  )
)
  for (const [user, detail] of [
    [haneul, '제 글에 외부 오픈채팅으로 유도하는 광고 댓글이 달렸습니다.'],
    [minji, '같은 댓글이 다른 글에도 반복해서 달리고 있어요.'],
  ])
    await call(user, 'POST', '/reports', {
      targetType: 'COMMUNITY_COMMENT',
      targetId: spam.id,
      reason: 'SPAM',
      detail,
    })
log('채팅·커뮤니티·신고 준비 완료')
console.log(
  JSON.stringify({
    ampoule,
    dinner,
    coffee,
    mist,
    stay,
    aHaneul,
    aMinji,
    vHaneul,
    pMinji,
    room: room.id,
  }),
)

// ───────── 5) 캠페인 목록 골고루 채우기 ─────────
await seedCatalog()
