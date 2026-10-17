import { test } from 'node:test'
import assert from 'node:assert/strict'
import { participationError } from '../src/features/discovery/participationError.js'
test('서버 만료 및 미설정 안내를 보존합니다', () => {
  assert.equal(
    participationError(
      { response: { status: 409, data: { detail: '만료된 요청입니다.' } } },
      '실패',
    ),
    '만료된 요청입니다.',
  )
  assert.match(
    participationError({ response: { status: 503 } }, '실패'),
    /발송 서비스를 이용할 수 없습니다/,
  )
})
test('시도 제한과 입력 필드 오류를 구분합니다', () => {
  assert.match(
    participationError({ response: { status: 429 } }, '실패'),
    /요청 횟수/,
  )
  assert.equal(
    participationError(
      { response: { data: { fieldErrors: { code: '6자리 번호입니다.' } } } },
      '실패',
    ),
    '6자리 번호입니다.',
  )
})
test('통신 실패의 결과를 임의로 성공 또는 미저장 처리하지 않습니다', () => {
  assert.equal(
    participationError(new Error('Network Error'), '결과를 확인해 주세요.'),
    '결과를 확인해 주세요.',
  )
})
