// AI 캠페인 초안 요청 만들기와 빈 칸에만 넣는 규칙을 확인합니다.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  aiDraftRequest,
  applyAiDraft,
} from '../src/features/sellerCampaigns/aiDraftModel.js'
import { CHANNEL_DEFAULTS } from '../src/features/sellerCampaigns/channelRequirementModel.js'

const draft = {
  description: 'AI 소개',
  mission: '1. 사용',
  submissionRequirement: '사진 3장',
  caution: '협찬 표시',
}

test('제목이 없으면 요청하지 않고 빈 값은 null로 보냅니다', () => {
  assert.throws(() => aiDraftRequest({ title: '  ' }, ''), /모집 제목/)
  assert.deepEqual(
    aiDraftRequest(
      {
        title: ' 앰플 체험 ',
        campaignType: 'PRODUCT',
        category: '',
        contentChannel: 'INSTAGRAM',
      },
      ' 민감 피부용 ',
    ),
    {
      title: '앰플 체험',
      campaignType: 'PRODUCT',
      category: null,
      contentChannel: 'INSTAGRAM',
      rewardDescription: null,
      highlights: '민감 피부용',
    },
  )
})

test('업체가 쓴 칸은 지키고 빈 칸과 채널 기본 문구 칸만 채웁니다', () => {
  const channelDefault = CHANNEL_DEFAULTS.INSTAGRAM.submissionRequirement
  const { next, filled, kept } = applyAiDraft(
    {
      contentChannel: 'INSTAGRAM',
      description: '',
      mission: '직접 쓴 미션',
      submissionRequirement: channelDefault,
      caution: '',
    },
    draft,
  )
  assert.equal(next.description, 'AI 소개')
  assert.equal(next.mission, '직접 쓴 미션')
  assert.equal(next.submissionRequirement, '사진 3장')
  assert.equal(next.caution, '협찬 표시')
  assert.deepEqual(filled, ['설명', '제출 요구사항', '주의사항'])
  assert.deepEqual(kept, ['요청사항 · 미션'])
})

test('비어 있는 초안 항목은 넣지 않습니다', () => {
  const { next, filled } = applyAiDraft(
    { description: '' },
    { ...draft, description: '  ' },
  )
  assert.equal(next.description, '')
  assert.equal(filled.includes('설명'), false)
})

test('실패 안내는 서버 설명을 먼저 쓰고, 없으면 상태별 한국어 안내를 씁니다', async () => {
  const { aiDraftError } = await import(
    '../src/features/sellerCampaigns/aiDraftModel.js'
  )
  assert.equal(
    aiDraftError({
      response: {
        status: 429,
        data: { detail: '오늘 AI 초안을 모두 사용했습니다(하루 20회).' },
      },
    }),
    '오늘 AI 초안을 모두 사용했습니다(하루 20회).',
  )
  assert.match(
    aiDraftError({ response: { status: 403, data: {} } }),
    /승인된 업체만/,
  )
  assert.match(aiDraftError({ response: { status: 503 } }), /지금은 AI 초안을/)
  assert.match(
    aiDraftError({ message: 'Network Error' }),
    /서버에 연결하지 못했습니다/,
  )
  assert.doesNotMatch(
    aiDraftError({ response: { status: 418 } }),
    /status code|418/,
  )
})

test('완료 안내에 채운 칸 수·그대로 둔 칸·남은 횟수를 적습니다', async () => {
  const { aiDraftNotice } = await import(
    '../src/features/sellerCampaigns/aiDraftModel.js'
  )
  const text = aiDraftNotice({
    filled: ['설명', '주의사항'],
    kept: ['요청사항 · 미션'],
    live: true,
    remainingToday: 3,
  })
  assert.match(text, /^완료: 2칸\(설명, 주의사항\)/)
  assert.match(text, /요청사항 · 미션 칸은 그대로/)
  assert.match(text, /오늘 3번 더/)
  const sample = aiDraftNotice({ filled: [], kept: [], live: false })
  assert.match(sample, /^완료: 비어 있는 칸이 없어/)
  assert.match(sample, /견본 초안/)
  assert.doesNotMatch(sample, /오늘/)
})
