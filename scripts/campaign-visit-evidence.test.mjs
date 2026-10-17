import test from 'node:test'
import assert from 'node:assert/strict'
import { createCampaignVisitEvidenceApi } from '../src/api/campaignVisitEvidenceApi.js'
test('기본 비활성 상태에서는 증빙 API를 호출하지 않는다', async () => {
  let calls = 0
  const api = createCampaignVisitEvidenceApi({
    authenticated: {
      get: () => {
        calls++
      },
    },
  })
  await assert.rejects(api.snapshot(11))
  await assert.rejects(api.history(15))
  assert.equal(calls, 0)
})
test('기존 미기록 신청은 현재 주소나 응답 부가 필드로 대체하지 않는다', async () => {
  let path
  const api = createCampaignVisitEvidenceApi({
    enabled: true,
    authenticated: {
      get: async (value) => {
        path = value
        return {
          data: {
            available: false,
            visitLocation: { venueName: '현재 주소를 대체하지 않음' },
          },
        }
      },
    },
  })
  assert.deepEqual(await api.snapshot(11), { available: false })
  assert.equal(path, '/campaign-applications/11/visit-snapshot')
})
test('없음과 조회 실패를 구분하고 기록 버전0을 보존한다', async () => {
  const api = createCampaignVisitEvidenceApi({
    enabled: true,
    authenticated: {
      get: async (path) => ({
        data: path.includes('snapshot')
          ? { available: true, presentationVersion: 0, visitLocation: null }
          : [],
      }),
    },
  })
  assert.equal((await api.snapshot(11)).presentationVersion, 0)
  assert.deepEqual(await api.history(15), [])
  const failed = createCampaignVisitEvidenceApi({
    enabled: true,
    authenticated: {
      get: async () => {
        throw new Error('403')
      },
    },
  })
  await assert.rejects(failed.snapshot(11))
  await assert.rejects(failed.history(15))
})
