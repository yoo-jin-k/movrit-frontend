/**
 * 참여 조정 API입니다: 신청 철회 · 참여 취소(단순·협의+증빙) · 기간 연장 · 업체 미선정 기록 · 운영자 처리.
 * 상태 판단(철회·취소·연장 가능 여부)은 서버 응답(changes)을 따르고, 화면은 입력값만 미리 확인합니다.
 */
import api from './axios'

const app = (id) => `/campaigns/applications/${encodeURIComponent(id)}`

// 이 신청으로 지금 할 수 있는 일, 연장·협의 취소 요청, 취소 횟수입니다.
export async function readParticipationChanges(applicationId, signal) {
  const { data } = await api.get(`${app(applicationId)}/changes`, {
    signal,
    timeout: 15000,
  })
  return data
}

// 선정 발표 전 신청 철회입니다. 취소 횟수는 남지 않습니다.
export async function withdrawApplication(applicationId, reason) {
  const { data } = await api.post(
    `${app(applicationId)}/withdraw`,
    { reason: reason?.trim() || null },
    { timeout: 15000 },
  )
  return data
}

// 선정 뒤 단순 참여 취소입니다. 취소 횟수 1회가 남습니다.
export async function selfCancelApplication(applicationId, reason) {
  const { data } = await api.post(
    `${app(applicationId)}/self-cancel`,
    { reason: reason.trim() },
    { timeout: 15000 },
  )
  return data
}

// 업체와 협의한 취소입니다. 협의 내용을 보여 주는 이미지 1장을 함께 보내고, 운영자가 확인합니다.
export async function requestAgreedCancel(applicationId, reason, evidence) {
  const body = new FormData()
  body.append('reason', new Blob([reason.trim()], { type: 'text/plain' }))
  body.append('evidence', evidence)
  // 기본 JSON 헤더를 지워 브라우저가 multipart 경계를 직접 붙이게 합니다.
  const { data } = await api.post(
    `${app(applicationId)}/cancel-requests`,
    body,
    {
      headers: { 'Content-Type': undefined },
      timeout: 30000,
    },
  )
  return data
}

// 증빙 이미지(본인·업체·운영자만)를 내려받아 화면에 띄울 주소로 바꿉니다. 다 쓰면 URL.revokeObjectURL로 해제합니다.
export async function readCancelEvidence(requestId) {
  const { data } = await api.get(
    `/cancel-requests/${encodeURIComponent(requestId)}/evidence`,
    { responseType: 'blob', timeout: 30000 },
  )
  return URL.createObjectURL(data)
}

// 기간 연장 요청(7·14일)과 업체의 승인·반려입니다.
export async function requestExtension(applicationId, days, reason) {
  const { data } = await api.post(
    `${app(applicationId)}/extension`,
    { days, reason: reason.trim() },
    { timeout: 15000 },
  )
  return data
}

export async function decideExtension(applicationId, approve, note) {
  const { data } = await api.patch(
    `${app(applicationId)}/extension`,
    { approve, note: note?.trim() || null },
    { timeout: 15000 },
  )
  return data
}

export async function readSellerExtensions(signal) {
  const { data } = await api.get('/campaigns/extension-requests', {
    signal,
    timeout: 15000,
  })
  return Array.isArray(data) ? data : []
}

// 업체 미선정 기록입니다(업체 본인 / 운영자 전체).
export async function readMyUnselected(signal) {
  const { data } = await api.get('/sellers/me/unselected-campaigns', {
    signal,
    timeout: 15000,
  })
  return data
}

export async function readAllUnselected(signal) {
  const { data } = await api.get('/admin/unselected-campaigns', {
    signal,
    timeout: 15000,
  })
  return data
}

// 운영자: 협의 취소 요청 목록과 처리, 자동 처리 작업 바로 실행
export async function readAdminCancelRequests(signal) {
  const { data } = await api.get('/admin/cancel-requests', {
    signal,
    timeout: 15000,
  })
  return Array.isArray(data) ? data : []
}

export async function decideCancelRequest(requestId, approve, note) {
  const { data } = await api.patch(
    `/admin/cancel-requests/${encodeURIComponent(requestId)}`,
    { approve, note: note?.trim() || null },
    { timeout: 15000 },
  )
  return data
}

export async function runParticipationJobs() {
  const { data } = await api.post('/admin/participation-jobs/run', undefined, {
    timeout: 60000,
  })
  return data
}

// 업체·운영자 직접 연장(1~30일, 횟수 제한 없음)과 연장 기록입니다. 모든 연장은 참여자 연장 횟수로 남습니다.
export async function readApplicationExtensions(applicationId, signal) {
  const { data } = await api.get(`${app(applicationId)}/extensions`, {
    signal,
    timeout: 15000,
  })
  return data
}

export async function directExtend(applicationId, days, reason) {
  const { data } = await api.post(
    `${app(applicationId)}/extensions`,
    { days: Number(days), reason: reason.trim() },
    { timeout: 15000 },
  )
  return data
}

// 운영자: 전체 기간 연장 요청 목록과 회원 한 명의 연장 횟수·이력입니다.
export async function readAdminExtensions(signal) {
  const { data } = await api.get('/admin/extension-requests', {
    signal,
    timeout: 15000,
  })
  return Array.isArray(data) ? data : []
}

export async function readMemberExtensions(memberId, signal) {
  const { data } = await api.get(
    `/admin/members/${encodeURIComponent(memberId)}/extensions`,
    { signal, timeout: 15000 },
  )
  return data
}
