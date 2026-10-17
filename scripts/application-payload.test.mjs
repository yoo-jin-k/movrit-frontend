import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applicationPayload } from '../src/features/discovery/applicationPayload.js'
const form = {
  version: 3,
  questions: [{ id: 'q1' }, { id: 'optional' }],
  agreements: [{ id: 'privacy', version: 'v2' }],
}
const values = {
  type: 'DELIVERY',
  message: ' 신청합니다 ',
  contact: { recipientName: '테스트' },
  answers: { q1: '답변', optional: ' ', oldQuestion: '이전 답변' },
  consents: { privacy: true, oldAgreement: true },
}
test('방문형 전환 후 과거 배송 개인정보가 제출되지 않습니다', () => {
  assert.equal(
    applicationPayload(form, { ...values, type: 'VISIT' }).shippingContact,
    null,
  )
})
test('최신 서버 질문과 문서 버전만 제출하고 선택형 빈 답변은 생략합니다', () => {
  const payload = applicationPayload(form, values)
  assert.deepEqual(payload.answers, [{ questionId: 'q1', value: '답변' }])
  assert.deepEqual(payload.agreementAcceptances, [
    { agreementId: 'privacy', version: 'v2', accepted: true },
  ])
  assert.equal(payload.expectedFormVersion, 3)
  assert.equal(payload.message, '신청합니다')
})
test('동의하지 않은 문서를 자동 동의로 처리하지 않습니다', () => {
  assert.equal(
    applicationPayload(form, { ...values, consents: {} })
      .agreementAcceptances[0].accepted,
    false,
  )
})

test('신청 시 확인한 조건 식별자와 버전을 전달해 삭제 후 재생성도 구분합니다', () => {
  const first = applicationPayload(form, values, { id: 10, version: 0 })
  const recreated = applicationPayload(form, values, { id: 11, version: 0 })
  assert.equal(first.expectedEligibilityRequirementId, 10)
  assert.equal(recreated.expectedEligibilityRequirementId, 11)
  assert.equal(first.expectedEligibilityRequirementVersion, 0)
  const none = applicationPayload(form, values, null)
  assert.equal(none.expectedEligibilityRequirementId, null)
  assert.equal(none.expectedEligibilityRequirementVersion, null)
})
