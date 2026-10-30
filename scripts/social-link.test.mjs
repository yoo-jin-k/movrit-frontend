import test from 'node:test'
import assert from 'node:assert/strict'
import {
  linkResultNotice,
  socialLinkRows,
} from '../src/features/membership/socialLinkModel.js'

// 설정 '로그인 연결' 표시 규칙만 검증합니다. 서버 연동 성공을 의미하지 않습니다.
test('연결 목록을 Google·카카오 순서의 상태로 정리합니다', () => {
  const rows = socialLinkRows([{ provider: 'KAKAO', email: null }])
  assert.deepEqual(
    rows.map(({ code, linked }) => [code, linked]),
    [
      ['GOOGLE', false],
      ['KAKAO', true],
    ],
  )
})
test('목록 형식이 아니면 연결 여부를 추측하지 않습니다', () => {
  assert.equal(socialLinkRows({ data: [] }), null)
})
test('연결 실패 시 서버 메시지를 우선 안내합니다', () => {
  assert.deepEqual(
    linkResultNotice({
      provider: 'GOOGLE',
      success: false,
      message: '이미 연결됨',
    }),
    { ok: false, text: '이미 연결됨' },
  )
  assert.equal(
    linkResultNotice({ provider: 'KAKAO', success: true }).text,
    '카카오 계정이 연결되었습니다.',
  )
})
