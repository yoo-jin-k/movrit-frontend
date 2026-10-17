import test from 'node:test'
import assert from 'node:assert/strict'
import { validateApplicationPreview } from '../src/features/discovery/applicationValidation.js'
import { createCampaignDetails } from '../src/features/discovery/campaignDetails.js'

// 실제 개인정보 없이 배송·방문 분기, 질문 및 문서 버전 경계를 확인합니다.
function fixture(profile = 'delivery') {
  const form = createCampaignDetails(profile, 0).form
  const values = {
    deliveryAddress: form.deliveryAddressRequired
      ? {
          recipientName: '검수',
          phone: '00000000000',
          postalCode: '00000',
          addressLine1: '검수 주소',
          additionalDetailNeeded: false,
          addressLine2: '',
        }
      : null,
    answers: Object.fromEntries(
      form.questions.map((q) => [
        q.id,
        {
          questionVersion: q.version,
          text: q.type === 'SHORT_TEXT' ? '짧게' : null,
          optionIds: q.type === 'SHORT_TEXT' ? [] : [q.options[0].id],
        },
      ]),
    ),
    consents: Object.fromEntries(
      form.consents.map((d) => [
        d.documentId,
        { documentVersionId: d.documentVersionId, accepted: d.required },
      ]),
    ),
  }
  return { form, values }
}
test('배송형 유효 입력과 선택 동의 거절을 허용합니다', () => {
  const { form, values } = fixture()
  assert.deepEqual(validateApplicationPreview(form, values, form.termsVersion), {})
})
test('배송 필수값과 조건부 상세주소 누락을 차단합니다', () => {
  const { form, values } = fixture()
  values.deliveryAddress.recipientName = ' '
  values.deliveryAddress.additionalDetailNeeded = true
  const errors = validateApplicationPreview(form, values, form.termsVersion)
  assert.ok(errors.recipientName)
  assert.ok(errors.addressLine2)
})
test('방문형은 주소 없이 검증되며 주소 전달을 차단합니다', () => {
  const { form, values } = fixture('visit')
  assert.deepEqual(validateApplicationPreview(form, values, form.termsVersion), {})
  values.deliveryAddress = {}
  assert.ok(validateApplicationPreview(form, values, form.termsVersion).deliveryAddress)
})
test('필수 단답형에 임의의 최소 10자 제한을 적용하지 않습니다', () => {
  const { form, values } = fixture('clip')
  assert.deepEqual(validateApplicationPreview(form, values, form.termsVersion), {})
  values.answers['602'].text = ' '
  assert.ok(validateApplicationPreview(form, values, form.termsVersion)['question-602'])
})
test('중복·허용되지 않은 옵션을 차단합니다', () => {
  const { form, values } = fixture('clip')
  values.answers['601'].optionIds = ['6010', '6010']
  assert.ok(validateApplicationPreview(form, values, form.termsVersion)['question-601'])
  values.answers['601'].optionIds = ['unknown']
  assert.ok(validateApplicationPreview(form, values, form.termsVersion)['question-601'])
})
test('조건·질문·동의 버전 변경을 차단합니다', () => {
  const { form, values } = fixture()
  values.answers['101'].questionVersion = 0
  values.consents['901'].documentVersionId = 'old'
  const errors = validateApplicationPreview(form, values, 0)
  assert.ok(errors.version)
  assert.ok(errors['question-101'])
  assert.ok(errors['consent-901'])
})
test('선택 문서도 명시적 선택이 필요하고 필수 문서 거절은 차단합니다', () => {
  const { form, values } = fixture()
  delete values.consents['903']
  values.consents['901'].accepted = false
  const errors = validateApplicationPreview(form, values, form.termsVersion)
  assert.ok(errors['consent-903'])
  assert.ok(errors['consent-901'])
})

// 목록 날짜는 상세 조건과 같은 값을 사용하며 한국 자정 경계도 확인합니다.
import { campaignTiming } from '../src/features/discovery/campaignDates.js'
test('상세 마감일과 목록 잔여일이 일치합니다', () => {
  const detail = createCampaignDetails('visit', 10)
  assert.equal(campaignTiming(detail.schedule, '2026-10-17T04:00:00+09:00').daysLeft, 4)
})
test('미구성 일정은 잔여일과 오늘 오픈을 만들지 않습니다', () => {
  assert.deepEqual(campaignTiming(null), { daysLeft: null, today: false })
})
test('한국 날짜 경계 및 당일 마감을 반영합니다', () => {
  const schedule = {
    recruitmentStartsAt: '2026-10-17T10:00:00+09:00',
    recruitmentEndsAt: '2026-10-21T10:00:00+09:00',
  }
  assert.deepEqual(campaignTiming(schedule, '2026-10-16T15:00:00Z'), { daysLeft: 4, today: true })
  assert.equal(campaignTiming(schedule, '2026-10-21T00:00:00+09:00').daysLeft, 0)
  assert.equal(campaignTiming(schedule, '2026-10-22T00:00:00+09:00').daysLeft, -1)
})
