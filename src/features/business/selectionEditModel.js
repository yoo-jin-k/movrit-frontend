/**
 * 업체 참여자 화면의 '진행 단계'와 '선정 편집' 규칙입니다(화면 없이 테스트할 수 있도록 분리).
 *
 * 선정 편집(서버: PATCH /api/campaigns/applications/{id}/manage)
 * - 선정 취소(unselect): 참여자가 수락하기 전(선정)에만 → 다시 '접수'
 * - 미선정 되돌리기(restore): 미선정 → 다시 '접수'
 * - 참여 취소(cancel): 선정·참여 중 → '취소'(사유 필수). 콘텐츠 제출 후에는 불가
 * 선정 취소·참여 취소로 자리가 비면 다른 신청자를 새로 선정할 수 있습니다.
 */

// 신청 진행 단계(표시용)입니다.
export const PROGRESS_STEPS = [
  ['SUBMITTED', '신청'],
  ['SELECTED', '선정'],
  ['ACTIVE', '참여 수락'],
  ['CONTENT_SUBMITTED', '콘텐츠 제출'],
  ['COMPLETED', '완료'],
]

// 상태가 진행 단계에서 몇 번째까지 왔는지입니다. 수정 요청은 콘텐츠 제출 단계로 봅니다.
const STEP_INDEX = {
  SUBMITTED: 0,
  SELECTED: 1,
  ACTIVE: 2,
  CONTENT_SUBMITTED: 3,
  REVISION_REQUESTED: 3,
  COMPLETED: 4,
}

/** 진행 단계 표시용 정보입니다. 미선정·취소는 단계 대신 종료 안내를 보여줍니다. */
export function progressOf(status) {
  if (status === 'REJECTED')
    return { ended: '미선정으로 종료되었습니다.', index: -1 }
  if (status === 'CANCELLED')
    return { ended: '취소되어 종료되었습니다.', index: -1 }
  return { ended: '', index: STEP_INDEX[status] ?? 0 }
}

/** 지금 상태에서 할 수 있는 선정 편집 목록입니다. */
export function manageActionsFor(status) {
  const actions = {
    SELECTED: [
      [
        'unselect',
        '선정 취소',
        '참여자가 수락하기 전이라 선정을 취소하고 다시 접수 상태로 돌립니다.',
        false,
      ],
      [
        'cancel',
        '참여 취소',
        '참여자 사정 등으로 이번 캠페인 참여를 취소합니다. 사유가 참여자에게 전달됩니다.',
        true,
      ],
    ],
    ACTIVE: [
      [
        'cancel',
        '참여 취소',
        '이미 참여를 수락한 참여자입니다. 사정이 생겨 참여를 취소합니다. 사유가 참여자에게 전달됩니다.',
        true,
      ],
    ],
    REJECTED: [
      [
        'restore',
        '미선정 되돌리기',
        '미선정을 취소하고 다시 접수 상태로 검토합니다.',
        false,
      ],
    ],
  }
  return (actions[status] || []).map(
    ([action, label, description, needsReason]) => ({
      action,
      label,
      description,
      needsReason,
    }),
  )
}

/** 캠페인 한 개의 모집 현황(신청·선정·수락 인원)을 신청 목록에서 셉니다. 취소는 신청 수에서 뺍니다. */
export function recruitmentSummary(applications, recruitmentCount) {
  const selectedOrLater = [
    'SELECTED',
    'ACTIVE',
    'CONTENT_SUBMITTED',
    'REVISION_REQUESTED',
    'COMPLETED',
  ]
  const acceptedOrLater = [
    'ACTIVE',
    'CONTENT_SUBMITTED',
    'REVISION_REQUESTED',
    'COMPLETED',
  ]
  const selected = applications.filter((a) =>
    selectedOrLater.includes(a.status),
  ).length
  return {
    applied: applications.filter((a) => a.status !== 'CANCELLED').length,
    selected,
    accepted: applications.filter((a) => acceptedOrLater.includes(a.status))
      .length,
    capacity: recruitmentCount ?? null,
    remaining:
      recruitmentCount == null
        ? null
        : Math.max(0, recruitmentCount - selected),
  }
}

/** 편집 요청 본문을 만듭니다. 사유가 필요한 편집인데 비어 있으면 막습니다. */
export function managePayload(item, reason) {
  const text = reason.trim()
  if (item.needsReason && !text)
    throw new Error('참여 취소 사유를 입력해 주세요.')
  return { action: item.action, reason: text || null }
}
