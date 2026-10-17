import test from 'node:test'
import assert from 'node:assert/strict'
import {
  prepareMediaSave,
  readMediaSession,
} from '../src/features/sellerCampaigns/campaignMediaWorkflow.js'
const a = '00000000-0000-4000-8000-000000000001'
const b = '00000000-0000-4000-8000-000000000002'
test('미디어 미주입 시 기존 폼을 그대로 반환하고 조회하지 않는다', async () => {
  const payload = { campaign: { title: '기존' } }
  assert.equal(await prepareMediaSave(null, payload), payload)
  assert.equal(await readMediaSession(null, 15), null)
})
test('선택 파일만 한 번 업로드하고 원자 요청 전체 목록에 포함한다', async () => {
  const file = new Blob(['x'], { type: 'image/png' })
  const calls = [],
    progress = []
  const draft = {
    representative: { key: 'new', file },
    details: [{ key: b, assetId: b, altText: '기존' }],
    location: null,
    locationConfirmed: false,
  }
  const payload = {
    campaign: { title: '캠페인' },
    applicationForm: { allowedFulfillmentTypes: ['DELIVERY'] },
  }
  const result = await prepareMediaSave(
    {
      upload: async (value) => {
        calls.push(value)
        return { assetId: a }
      },
    },
    payload,
    { draft, managed: null },
    { editing: false },
    (next) => progress.push(next),
  )
  assert.equal(calls.length, 1)
  assert.equal(result.presentation.representativeAssetId, a)
  assert.equal(result.presentation.detailImages[0].assetId, b)
  assert.equal(progress.at(-1).representative.status, 'uploaded')
  assert.equal(draft.representative.assetId, undefined)
})
test('업로드 실패는 다음 파일과 저장 요청 생성 없이 호출자에 전달한다', async () => {
  let calls = 0
  const failure = new Error('응답 유실')
  const draft = {
    representative: { file: {} },
    details: [{ file: {}, altText: '' }],
  }
  await assert.rejects(
    prepareMediaSave(
      {
        upload: async () => {
          calls++
          throw failure
        },
      },
      {},
      { draft },
      {},
    ),
    (error) => error === failure,
  )
  assert.equal(calls, 1)
})
test('관리 자산의 인증 blob을 미리보기에 사용하며 공개 URL을 요청하지 않는다', async () => {
  const paths = []
  const blob = new Blob(['x'], { type: 'image/png' })
  const session = await readMediaSession(
    {
      manage: async () => ({
        version: 2,
        representativeImage: {
          assetId: a,
          publicUrl: 'https://unused.invalid',
        },
        detailImages: [],
        visitLocation: null,
      }),
      preview: async (id) => {
        paths.push(id)
        return blob
      },
    },
    15,
  )
  assert.deepEqual(paths, [a])
  assert.equal(session.draft.representative.file, blob)
  assert.equal(session.draft.representative.status, 'existing')
  assert.equal(session.managed.version, 2)
})
