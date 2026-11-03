// 남의 자료 접근 점검: 주소의 ID만 바꿔서 다른 사람의 신청·채팅·배송·증빙·주소·알림이나 다른 업체의 캠페인·참여자를 보거나 바꿀 수 없는지 확인합니다.
// 계정: 주인 demo-user(참여자 A) · 다른 참여자 demo-creator(B) · 주인 업체 demo-brand · 다른 업체 demo-brand2 · 운영자 demo-admin.
// 준비: qa-checks.mjs 를 한 번 실행해 demo-brand2 업체 계정이 있어야 합니다.
// 점검용 캠페인·주소·글만 만들고, 끝나면 캠페인은 마감하고 주소·글은 지웁니다. 비공개 업로드 폴더가 /uploads 로 열리지 않는지도 봅니다.
import { api, call, login } from './e2e-lib.mjs'
import { applyDelivery, createCampaign } from './fixtures.mjs'

const owner = await login('demo-user@movrit.local')
const other = await login('demo-creator@movrit.local')
const brand = await login('demo-brand@movrit.local')
const brand2 = await login('demo-brand2@movrit.local')
const results = []
const check = (name, ok, detail = '') => {
  results.push(ok)
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`)
}
// 거절은 401·403·404 중 하나여야 합니다(2xx면 남의 자료가 열린 것, 400·409는 권한보다 입력 검사가 먼저 된 것).
const DENIED = [401, 403, 404]
async function denied(name, auth, method, path, body) {
  const res = await call(auth, method, path, body)
  check(
    `거절: ${name}`,
    DENIED.includes(res.status),
    `${method} ${path} → ${res.status}`,
  )
}
async function deniedRaw(name, auth, path) {
  const res = await fetch(`${api}${path}`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  })
  check(
    `거절: ${name}`,
    DENIED.includes(res.status),
    `GET ${path} → ${res.status}`,
  )
}
const stamp = new Date().toISOString().slice(0, 16)

// ───────── 준비: 주인 업체 캠페인에 참여자 A가 신청 ─────────
const campaignId = await createCampaign(brand, {
  title: `[QA-ACL] 권한 점검 ${stamp}`,
  recruit: 2,
  details: {},
})
const appId = await applyDelivery(owner, campaignId)
check(
  '준비: 캠페인과 신청',
  Boolean(campaignId && appId),
  `${campaignId}/${appId}`,
)
const app = `/campaigns/applications/${appId}`

// ───────── 1) 다른 참여자(B)가 A의 신청에 손대기 ─────────
await denied('신청 내용 수정', other, 'PUT', app, {
  message: '남이 고친 메시지',
  expectedFormVersion: 1,
  answers: [],
})
await denied('신청 철회', other, 'POST', `${app}/withdraw`, {
  reason: '남이 철회',
})
await denied('참여 조정 정보 보기', other, 'GET', `${app}/changes`)
await denied('방문 예약 보기', other, 'GET', `${app}/visit-reservation`)
await denied('배송 보기', other, 'GET', `${app}/shipment`)
await denied('구매 인증 보기', other, 'GET', `${app}/purchase-proof`)
await deniedRaw('구매 인증 이미지', other, `${app}/purchase-proof/evidence`)
await denied(
  '방문 기록 보기',
  other,
  'GET',
  `/campaign-applications/${appId}/visit-snapshot`,
)

// 업체가 선정해 참여 중으로 만든 뒤, 진행 중 기능도 확인합니다.
await call(brand, 'PATCH', `${app}/select`)
await denied('참여 취소', other, 'POST', `${app}/self-cancel`, {
  reason: '남이 취소',
})
await denied('기간 연장 요청', other, 'POST', `${app}/extension`, {
  days: 7,
  reason: '남이 요청',
})
await denied(
  '콘텐츠 제출',
  other,
  'POST',
  `/campaign-contents/applications/${appId}`,
  {
    contentUrl: 'https://instagram.com/p/qa-acl',
  },
)
await denied(
  '콘텐츠 링크 제출',
  other,
  'POST',
  `/campaign-contents/applications/${appId}/links`,
  {
    links: [
      {
        channelType: 'INSTAGRAM',
        contentUrl: 'https://instagram.com/p/qa-acl',
      },
    ],
  },
)
await denied('업체용 참여자 상세', other, 'GET', `${app}/seller-detail`)
await denied('업체 신청 목록', other, 'GET', '/campaigns/applications/seller')

// 채팅: 업체가 A와 대화방을 열고, B가 그 방을 엿보거나 글을 쓰려 합니다.
const room = (await call(brand, 'POST', `/chats/applications/${appId}`)).data
await denied('남의 채팅 읽기', other, 'GET', `/chats/${room.id}/messages`)
await denied('남의 채팅에 쓰기', other, 'POST', `/chats/${room.id}/messages`, {
  body: '끼어든 메시지',
})
await denied('남의 채팅 검색', other, 'GET', `/chats/${room.id}/search?q=a`)
await denied(
  '다른 업체가 채팅 읽기',
  brand2,
  'GET',
  `/chats/${room.id}/messages`,
)

// ───────── 2) 다른 업체(brand2)가 주인 업체 캠페인·참여자에 손대기 ─────────
const campaign = `/collaborations/campaigns/${campaignId}`
await denied('참여자 상세', brand2, 'GET', `${app}/seller-detail`)
await denied('미선정 처리', brand2, 'PATCH', `${app}/reject`)
await denied('선정 편집(참여 취소)', brand2, 'PATCH', `${app}/manage`, {
  action: 'cancel',
  reason: '다른 업체',
})
await denied(
  '참여자 활동·평가 보기',
  brand2,
  'GET',
  `${app}/participant-activity`,
)
await denied('참여자 평가 남기기', brand2, 'PUT', `${app}/rating`, {
  rating: 1,
})
await denied('패널티 기록', brand2, 'POST', `${app}/penalty`, {
  type: 'NO_SUBMIT',
  reason: '다른 업체',
})
await denied('연장 요청 처리', brand2, 'PATCH', `${app}/extension`, {
  approve: true,
})
await denied('배송 목록', brand2, 'GET', `/campaigns/${campaignId}/shipping`)
await deniedRaw(
  '배송지 엑셀',
  brand2,
  `/campaigns/${campaignId}/shipping/export`,
)
await denied('캠페인 마감', brand2, 'PATCH', `${campaign}/close`)
await denied('담당자 연락처 보기', brand2, 'GET', `${campaign}/contact`)
await denied('담당자 연락처 바꾸기', brand2, 'PUT', `${campaign}/contact`, {
  name: '가로채기',
  phone: '010-0000-0000',
})
await denied(
  '콘텐츠 성과',
  brand2,
  'GET',
  `/campaigns/${campaignId}/content-performance`,
)
await denied(
  '표시 정보 관리',
  brand2,
  'GET',
  `/campaigns/${campaignId}/presentation/manage`,
)
await denied(
  '신청서 양식 바꾸기',
  brand2,
  'PUT',
  `/campaigns/${campaignId}/application-form`,
  {
    allowedFulfillmentTypes: ['DELIVERY'],
    questions: [],
    agreements: [],
  },
)

// ───────── 3) 일반 회원이 운영자 기능 쓰기 ─────────
await denied('운영자 패널티 목록', other, 'GET', '/admin/penalties')
await denied('운영자 협의 취소 목록', other, 'GET', '/admin/cancel-requests')
await denied('운영자 신청 목록', brand, 'GET', '/admin/campaign-applications')
await denied(
  '운영자 자동 처리 실행',
  brand,
  'POST',
  '/admin/participation-jobs/run',
)

// ───────── 4) 주소·알림·커뮤니티 글 ─────────
const address = (
  await call(owner, 'POST', '/members/me/addresses', {
    label: '권한점검',
    recipientName: '점검',
    recipientPhone: '010-0000-0000',
    postalCode: '04524',
    address1: '서울특별시 중구 세종대로 110',
    address2: '점검',
    defaultAddress: false,
  })
).data
if (address?.id) {
  await denied(
    '남의 배송지 고치기',
    other,
    'PUT',
    `/members/me/addresses/${address.id}`,
    {
      label: '가로채기',
      recipientName: '가로채기',
      recipientPhone: '010-1111-1111',
      postalCode: '04524',
      address1: '가로채기',
      address2: '',
      defaultAddress: false,
    },
  )
  await denied(
    '남의 배송지 지우기',
    other,
    'DELETE',
    `/members/me/addresses/${address.id}`,
  )
  const mine = (await call(owner, 'GET', '/members/me/addresses')).data
  check(
    '배송지는 그대로',
    mine.some((a) => a.id === address.id && a.label === '권한점검'),
  )
} else
  check(
    '준비: 점검용 배송지',
    false,
    '배송지를 만들지 못했습니다(10개 한도일 수 있음)',
  )

const notes = (await call(owner, 'GET', '/notifications')).data
const note = (Array.isArray(notes) ? notes : notes?.content || []).find(
  (n) => !n.read,
)
if (note)
  await denied(
    '남의 알림 읽음 처리',
    other,
    'PATCH',
    `/notifications/${note.id}/read`,
  )

const post = (
  await call(owner, 'POST', '/community/posts', {
    board: 'free',
    category: '일상',
    title: `[점검] 권한 확인용 글 ${stamp}`,
    body: '다른 회원이 고치거나 지울 수 없는지 확인하는 점검용 글입니다.',
  })
).data
await denied('남의 글 고치기', other, 'PUT', `/community/posts/${post.id}`, {
  board: 'free',
  category: '일상',
  title: '가로챈 제목',
  body: '다른 회원이 고친 본문입니다.',
})
await denied('남의 글 지우기', other, 'DELETE', `/community/posts/${post.id}`)

// ───────── 5) 비공개 업로드 폴더는 주소를 알아도 열리지 않음 ─────────
for (const folder of [
  'purchase-proof',
  'cancel-evidence',
  'chat-attachments',
  'channel-evidence',
  'member-avatars',
]) {
  const res = await fetch(
    `${api.replace('/api', '')}/uploads/${folder}/qa-check.png`,
  )
  check(
    `비공개 폴더 직접 열기 차단: ${folder}`,
    DENIED.includes(res.status),
    String(res.status),
  )
}

// ───────── 마무리: 주인 자료가 그대로인지 확인하고 정리 ─────────
const after = (
  await call(owner, 'GET', '/campaigns/applications/mine')
).data.find((a) => String(a.id) === String(appId))
check('A의 신청은 참여 중 그대로', after?.status === 'ACTIVE', after?.status)
const messages = (await call(owner, 'GET', `/chats/${room.id}/messages`)).data
check(
  '채팅방에 끼어든 메시지 없음',
  !JSON.stringify(messages).includes('끼어든 메시지'),
)
await call(brand, 'PATCH', `${campaign}/close`)
if (address?.id)
  await call(owner, 'DELETE', `/members/me/addresses/${address.id}`)
if (post?.id) await call(owner, 'DELETE', `/community/posts/${post.id}`)

console.log(`\n결과: ${results.filter(Boolean).length}/${results.length} 통과`)
