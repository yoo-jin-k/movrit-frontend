import axios from 'axios'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  presentationRequest,
  validatePendingMedia,
  mediaDraftFromManaged,
  withCampaignPresentation,
  changeMediaFulfillment,
} from '../src/features/sellerCampaigns/campaignMediaContract.js'
import { createCampaignMediaApi } from '../src/api/campaignMediaApi.js'
const a = '00000000-0000-4000-8000-000000000001'
const b = '00000000-0000-4000-8000-000000000002'
const draft = () => ({
  representative: { assetId: a },
  details: [{ assetId: b, altText: ' 설명 ' }],
  location: { venueName: '매장', address1: '주소', postalCode: '' },
  locationConfirmed: true,
})
test('신규는 버전 생략, 수정은 0도 포함하고 배송 주소는 null', () => {
  const initial = presentationRequest(draft())
  assert.equal('expectedPresentationVersion' in initial, false)
  assert.equal(initial.presentation.visitLocation, null)
  assert.equal(initial.presentation.detailImages[0].altText, '설명')
  const edited = presentationRequest(draft(), {
    editing: true,
    version: 0,
    fulfillmentTypes: ['VISIT'],
  })
  assert.equal(edited.expectedPresentationVersion, 0)
  assert.equal(edited.presentation.visitLocation.postalCode, null)
  assert.throws(() => presentationRequest(draft(), { editing: true }))
})
test('미업로드/중복 자산과 대표 제거를 차단하고 레거시 null만 허용', () => {
  assert.throws(() =>
    presentationRequest({ ...draft(), representative: { file: {} } }),
  )
  assert.throws(() =>
    presentationRequest({ ...draft(), details: [{ assetId: a, altText: '' }] }),
  )
  const legacy = { ...draft(), representative: null }
  assert.throws(() => presentationRequest(legacy))
  assert.throws(() =>
    presentationRequest(legacy, {
      editing: true,
      version: 1,
      originalHadRepresentative: true,
    }),
  )
  assert.equal(
    presentationRequest(legacy, { editing: true, version: 0 }).presentation
      .representativeAssetId,
    null,
  )
  assert.throws(() =>
    presentationRequest(
      { ...draft(), locationConfirmed: false },
      { fulfillmentTypes: ['VISIT'] },
    ),
  )
})
test('서버 미반영 기본 상태에서는 어떤 요청도 나가지 않는다', async () => {
  let calls = 0
  const client = {
    get: () => {
      calls++
    },
    post: () => {
      calls++
    },
  }
  const api = createCampaignMediaApi({
    authenticated: client,
    publicClient: client,
  })
  await assert.rejects(api.upload(new Blob()))
  await assert.rejects(api.preview(a))
  await assert.rejects(api.manage(15))
  await assert.rejects(api.publicPresentation(15))
  assert.equal(calls, 0)
})
test('인증 preview와 공개 조회를 분리하며 409는 재시도하지 않는다', async () => {
  const requests = []
  const conflict = { response: { status: 409 } }
  const api = createCampaignMediaApi({
    enabled: true,
    authenticated: {
      get: async (path, options) => {
        requests.push({ path, options })
        return { data: new Blob(['image'], { type: 'image/png' }) }
      },
      post: async () => {
        requests.push('upload')
        throw conflict
      },
    },
    publicClient: {
      get: async (path) => {
        requests.push(path)
        return { data: { detailImages: [], visitLocation: null } }
      },
    },
  })
  assert.ok((await api.preview(a)) instanceof Blob)
  assert.equal(requests[0].path, `/campaign-image-assets/${a}/preview`)
  assert.equal(requests[0].options.responseType, 'blob')
  await api.publicPresentation(15)
  assert.equal(requests[1], '/campaigns/15/presentation/public')
  await assert.rejects(
    api.upload(new Blob(['image'], { type: 'image/png' })),
    (error) => error === conflict,
  )
  assert.equal(requests.filter((value) => value === 'upload').length, 1)
})

test('레거시 방문 이미지 단독 수정은 주소 키를 생략하고 배송 전환은 null', () => {
  const legacy = { ...draft(), location: null, locationConfirmed: false }
  const options = {
    editing: true,
    version: 0,
    originalFulfillmentTypes: ['VISIT'],
    fulfillmentTypes: ['VISIT'],
  }
  assert.equal(
    'visitLocation' in presentationRequest(legacy, options).presentation,
    false,
  )
  assert.equal(
    JSON.stringify(presentationRequest(legacy, options)).includes(
      'visitLocation',
    ),
    false,
  )
  assert.equal(
    presentationRequest(legacy, { ...options, fulfillmentTypes: ['DELIVERY'] })
      .presentation.visitLocation,
    null,
  )
  assert.throws(() =>
    presentationRequest(legacy, {
      ...options,
      originalFulfillmentTypes: ['DELIVERY'],
    }),
  )
  assert.throws(() =>
    presentationRequest(legacy, {
      ...options,
      originalVisitLocation: { venueName: '기존 장소', address1: '주소' },
    }),
  )
  assert.throws(() =>
    presentationRequest(
      { ...legacy, location: { venueName: '작성 시작' } },
      options,
    ),
  )
})
test('관리 DTO와 configured 폼을 연결하되 원본 및 비활성 주소는 공개하지 않는다', () => {
  const managed = {
    version: 0,
    representativeImage: null,
    detailImages: [],
    visitLocation: null,
    retainedVisitLocation: { venueName: '숨긴 장소' },
  }
  const current = mediaDraftFromManaged(managed)
  assert.equal(current.location, null)
  const payload = {
    campaign: { title: '테스트' },
    applicationForm: { allowedFulfillmentTypes: ['VISIT'] },
  }
  const result = withCampaignPresentation(payload, current, {
    managed,
    editing: true,
    originalFulfillmentTypes: ['VISIT'],
  })
  assert.equal(result.expectedPresentationVersion, 0)
  assert.equal('visitLocation' in result.presentation, false)
  assert.equal('presentation' in payload, false)
  const confirmed = {
    ...current,
    location: { venueName: '장소' },
    locationConfirmed: true,
  }
  const switched = changeMediaFulfillment(confirmed, ['VISIT'], ['DELIVERY'])
  assert.equal(switched.locationConfirmed, false)
  assert.equal(switched.location, confirmed.location)
})

test('기존 구조화 주소를 바꾸지 않은 이미지 수정은 주소를 생략한다', () => {
  const location = {
    venueName: '매장',
    address1: '주소',
    postalCode: null,
    address2: null,
  }
  const current = { ...draft(), location, locationConfirmed: false }
  const options = {
    editing: true,
    version: 2,
    originalFulfillmentTypes: ['VISIT'],
    fulfillmentTypes: ['VISIT'],
    originalVisitLocation: location,
  }
  assert.equal(
    'visitLocation' in presentationRequest(current, options).presentation,
    false,
  )
  assert.throws(() =>
    presentationRequest(
      { ...current, location: { ...location, address1: '새 주소' } },
      options,
    ),
  )
  assert.equal(
    presentationRequest({ ...current, locationConfirmed: true }, options)
      .presentation.visitLocation.address1,
    '주소',
  )
})

test('JSON 기본 클라이언트에서도 파일이 FormData로 유지된다', async () => {
  let captured
  const client = axios.create({
    headers: { 'Content-Type': 'application/json' },
    adapter: async (config) => {
      captured = config
      return {
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
        data: { assetId: a, state: 'READY_UNATTACHED', publicUrl: null },
      }
    },
  })
  const api = createCampaignMediaApi({ authenticated: client, enabled: true })
  await api.upload(new Blob(['file'], { type: 'image/png' }))
  assert.ok(captured.data instanceof FormData)
  assert.ok(captured.data.get('file') instanceof Blob)
  assert.notEqual(captured.headers.get('Content-Type'), 'application/json')
})

test('새 파일 단계에서도 주소·대표 누락은 업로드 전에 검증한다', () => {
  const pending = {
    ...draft(),
    representative: { file: new Blob(['x'], { type: 'image/png' }) },
  }
  assert.doesNotThrow(() => validatePendingMedia(pending))
  assert.throws(() =>
    validatePendingMedia({ ...pending, representative: null }),
  )
  assert.throws(() =>
    validatePendingMedia(
      { ...pending, locationConfirmed: false },
      { fulfillmentTypes: ['VISIT'] },
    ),
  )
})
