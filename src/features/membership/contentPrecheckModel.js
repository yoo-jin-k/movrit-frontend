/**
 * 참여자 '제출 전 점검' 화면 규칙입니다.
 * 서버에 보낼 요청을 만들고, 받은 결과를 고칠 항목이 먼저 보이게 정리하며, 실패를 한국어 안내로 바꿉니다.
 * 서버 API: POST /api/campaign-contents/ai/applications/{applicationId}/precheck (신청 당사자, 하루 횟수 제한)
 */

// 서버 제한과 같은 본문 최대 길이입니다.
export const PRECHECK_CONTENT_MAX = 8000

export const PRECHECK_STATUS = {
  MISSING: '보완 필요',
  UNCLEAR: '직접 확인',
  MET: '확인됨',
}

const ORDER = { MISSING: 0, UNCLEAR: 1, MET: 2 }

// 서버와 같은 기준입니다. 참여 중이거나 수정 요청을 받은 신청에서만 점검 영역을 보입니다.
export function precheckAvailable(application) {
  return ['ACTIVE', 'REVISION_REQUESTED'].includes(application?.status)
}

// 본문이 비었거나 너무 길면 요청 전에 안내합니다. 채널은 선택한 첫 게시물 채널을 쓰고, 없으면 서버가 캠페인 채널을 씁니다.
export function precheckRequest(content, channelType) {
  const text = String(content || '').trim()
  if (!text) throw new Error('점검할 본문을 붙여 넣어 주세요.')
  if (text.length > PRECHECK_CONTENT_MAX)
    throw new Error('본문은 8,000자 이내로 붙여 넣어 주세요.')
  return { content: text, channelType: channelType || null }
}

// 서버 응답 형식을 확인합니다. 형식이 다르면 '모두 통과'처럼 보이지 않도록 오류로 다룹니다.
export function validPrecheck(data) {
  return Boolean(
    data &&
      typeof data.summary === 'string' &&
      Array.isArray(data.items) &&
      data.items.length > 0 &&
      data.items.every(
        (item) =>
          item &&
          typeof item.criterion === 'string' &&
          Object.hasOwn(PRECHECK_STATUS, item.status),
      ) &&
      typeof data.disclosureFound === 'boolean' &&
      typeof data.live === 'boolean' &&
      Number.isInteger(data.remainingToday),
  )
}

// 보완 필요 → 직접 확인 → 확인됨 순서로 정렬하고 상태별 개수를 셉니다.
export function precheckView(result) {
  const items = [...result.items].sort(
    (a, b) => ORDER[a.status] - ORDER[b.status],
  )
  const count = (status) => items.filter((i) => i.status === status).length
  return {
    items,
    missing: count('MISSING'),
    unclear: count('UNCLEAR'),
    met: count('MET'),
  }
}

const ERROR_BY_STATUS = {
  400: '붙여 넣은 본문을 다시 확인해 주세요.',
  401: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
  404: '이 신청에서는 점검할 수 없습니다. 최신 내역을 확인해 주세요.',
  409: '콘텐츠를 준비하는 단계에서만 점검할 수 있습니다. 최신 내역을 확인해 주세요.',
  429: '오늘 제출 전 점검을 모두 사용했습니다. 내일 다시 이용해 주세요.',
  502: '점검 결과를 정리하지 못했습니다. 다시 시도해 주세요.',
  503: '지금은 제출 전 점검을 쓸 수 없습니다. 잠시 후 다시 시도해 주세요.',
}

// 서버의 한국어 설명(detail)을 먼저 쓰고, 없으면 상태별 안내를 씁니다. 영어 오류 문장은 보이지 않습니다.
export function precheckError(failure) {
  const detail = failure?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  const status = failure?.response?.status
  if (ERROR_BY_STATUS[status]) return ERROR_BY_STATUS[status]
  if (!failure?.response)
    return failure?.message && /[가-힣]/.test(failure.message)
      ? failure.message
      : '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  return '점검하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}
