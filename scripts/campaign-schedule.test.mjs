import test from 'node:test'
import assert from 'node:assert/strict'
import {
  schedulePeriods,
  periodsOnDay,
  monthGrid,
  shiftMonth,
  seoulDay,
  periodHasEnded,
  liveCampaignSchedule,
} from '../src/features/discovery/scheduleModel.js'

// 달력의 표시 경계만 확인하며 운영 상태와 권한을 대신 판정하지 않습니다.
test('시작·종료는 기간이고 발표일과 시작일 없는 등록마감은 단일일입니다', () => {
  const periods = schedulePeriods({
    recruitmentStartsAt: '2026-10-12T00:00:00',
    recruitmentEndsAt: '2026-10-20T23:59:00',
    selectionDueAt: '2026-10-21T10:00:00',
    experienceStartsAt: '2026-10-22T00:00:00',
    experienceEndsAt: '2026-11-03T23:59:00',
    submissionDueAt: '2026-11-05T23:59:00',
  })
  assert.equal(periods[0].text, '10.12~10.20')
  assert.equal(periods[1].text, '10.21')
  assert.equal(periods[2].text, '10.22~11.03')
  assert.equal(periods[3].label, '콘텐츠 등록 마감')
  assert.equal(periods[3].start, null)
})
test('동일한 날의 기간과 겹치는 여러 단계는 모두 표시합니다', () => {
  const periods = schedulePeriods({
    recruitmentStartsAt: '2026-10-20T00:00:00',
    recruitmentEndsAt: '2026-10-20T23:59:00',
    selectionDueAt: '2026-10-20T20:00:00',
    experienceStartsAt: '2026-10-20T10:00:00',
    experienceEndsAt: '2026-10-22T22:00:00',
  })
  assert.equal(periods[0].text, '10.20~10.20')
  assert.deepEqual(
    periodsOnDay(periods, '2026-10-20').map((p) => p.id),
    ['recruitment', 'selection', 'experience'],
  )
})
test('월·연도 이동과 윤년 월격자를 정확히 생성합니다', () => {
  assert.deepEqual(shiftMonth(2026, 12, 1), { year: 2027, month: 1 })
  assert.deepEqual(shiftMonth(2027, 1, -1), { year: 2026, month: 12 })
  assert.equal(monthGrid(2028, 2).filter(Boolean).length, 29)
  assert.equal(monthGrid(2026, 2).filter(Boolean).length, 28)
  assert.equal(monthGrid(2026, 10).length % 7, 0)
})
test('서버 필드가 없으면 예시 일정으로 채우지 않습니다', () => {
  assert.ok(schedulePeriods(null).every((p) => p.text === '미구성'))
  assert.deepEqual(periodsOnDay(schedulePeriods(null), '2026-10-17'), [])
  assert.ok(schedulePeriods(liveCampaignSchedule({})).every((period) => period.text === '미구성'))
})
test('시작일이 종료일보다 늦으면 잘못된 기간을 색칠하지 않습니다', () => {
  const periods = schedulePeriods({
    recruitmentStartsAt: '2026-10-21T00:00:00',
    recruitmentEndsAt: '2026-10-20T23:59:00',
  })
  assert.equal(periods[0].invalid, true)
  assert.deepEqual(periodsOnDay(periods, '2026-10-20'), [])
})
test('UTC/KST 자정과 정확한 마감 순간을 구분합니다', () => {
  assert.equal(seoulDay('2026-10-16T15:00:00Z'), '2026-10-17')
  assert.equal(seoulDay('2026-10-17T00:00:00'), '2026-10-17')
  assert.equal(periodHasEnded('2026-10-17T18:00:00', new Date('2026-10-17T08:59:59.999Z')), false)
  assert.equal(periodHasEnded('2026-10-17T18:00:00', new Date('2026-10-17T09:00:00Z')), true)
})

test('실제 서버의 자정 제외 경계와 단계별 필드를 일치시킵니다', () => {
  const schedule = liveCampaignSchedule({
    startAt: '2026-12-30T00:00:00',
    endAt: '2027-01-02T00:00:00',
    selectionAnnouncedAt: '2027-01-02T10:00:00',
    contentSubmissionStartAt: '2027-01-03T00:00:00',
    contentSubmissionEndAt: '2027-01-05T00:00:00',
    resultsAnnouncedAt: '2027-01-06T00:00:00',
    scheduleVersion: 3,
  })
  const periods = schedulePeriods(schedule)
  assert.equal(periods[0].text, '12.30~01.01')
  assert.equal(periods[3].text, '01.03~01.04')
  assert.equal(periods[4].text, '01.06')
  assert.equal(
    periodsOnDay(periods, '2027-01-02').some((period) => period.id === 'recruitment'),
    false,
  )
  assert.equal(schedule.version, 3)
})
