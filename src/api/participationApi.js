/**
 * 참여 운영 API입니다: 일괄 선정·미선정, 선정 전 신청 수정, 방문 예약, 활동 등급·패널티, 참여자 평가, 마감 알림, 신고·제재.
 */
import api from './axios'

const app = (id) => `/campaigns/applications/${encodeURIComponent(id)}`

// 여러 신청을 한 번에 선정(select)·미선정(reject)합니다. 건별 성공·실패 사유가 돌아옵니다.
export async function bulkApplications(applicationIds, action) {
  const { data } = await api.patch(
    '/campaigns/applications/bulk',
    { applicationIds, action },
    { timeout: 60000 },
  )
  return data
}

// 선정 전(접수) 신청의 메시지·배송지·질문 답변을 고칩니다.
export async function reviseApplication(applicationId, body) {
  const { data } = await api.put(app(applicationId), body, { timeout: 15000 })
  return data
}

// 방문 예약입니다. 아직 요청 전이면 null입니다(서버 204).
export async function readVisitReservation(applicationId, signal) {
  const response = await api.get(`${app(applicationId)}/visit-reservation`, {
    signal,
    timeout: 15000,
  })
  return response.status === 204 || !response.data ? null : response.data
}

export async function requestVisitReservation(applicationId, body) {
  const { data } = await api.post(
    `${app(applicationId)}/visit-reservation`,
    body,
    { timeout: 15000 },
  )
  return data
}

export async function confirmVisitReservation(applicationId) {
  const { data } = await api.patch(
    `${app(applicationId)}/visit-reservation/confirm`,
    undefined,
    { timeout: 15000 },
  )
  return data
}

export async function rejectVisitReservation(applicationId, reason) {
  const { data } = await api.patch(
    `${app(applicationId)}/visit-reservation/reject`,
    { reason },
    { timeout: 15000 },
  )
  return data
}

// 내 활동 등급·패널티·신청 제한입니다.
export async function readMyActivity(signal) {
  const { data } = await api.get('/members/me/activity', {
    signal,
    timeout: 15000,
  })
  return data
}

// 업체용: 참여자 등급·평가 평균·이 신청에 남긴 내 평가입니다.
export async function readParticipantActivity(applicationId, signal) {
  const { data } = await api.get(`${app(applicationId)}/participant-activity`, {
    signal,
    timeout: 15000,
  })
  return data
}

export async function rateParticipant(applicationId, rating, memo) {
  const { data } = await api.put(
    `${app(applicationId)}/rating`,
    { rating, memo: memo?.trim() || null },
    { timeout: 15000 },
  )
  return data
}

// 업체가 미제출(NO_SUBMIT)·노쇼(NO_SHOW) 패널티를 기록합니다. 기록하면 참여가 취소됩니다.
export async function recordPenalty(applicationId, type, reason) {
  const { data } = await api.post(
    `${app(applicationId)}/penalty`,
    { type, reason },
    { timeout: 15000 },
  )
  return data
}

// 운영자: 패널티 취소, 마감 알림 바로 실행
export async function revokePenalty(penaltyId, reason) {
  const { data } = await api.patch(
    `/admin/penalties/${encodeURIComponent(penaltyId)}/revoke`,
    { reason },
    { timeout: 15000 },
  )
  return data
}

export async function runDeadlineReminders() {
  const { data } = await api.post('/admin/deadline-reminders/run', undefined, {
    timeout: 30000,
  })
  return data
}

// 신고 접수와 운영자 처리입니다.
export async function createReport(body) {
  const { data } = await api.post('/reports', body, { timeout: 15000 })
  return data
}

export async function handleReport(reportId, action, note) {
  const { data } = await api.patch(
    `/admin/content-reports/${encodeURIComponent(reportId)}`,
    { action, note: note?.trim() || null },
    { timeout: 15000 },
  )
  return data
}
