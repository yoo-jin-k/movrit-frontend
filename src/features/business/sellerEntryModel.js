/**
 * 업체 신청(/seller/apply)·이용 서비스 선택(/roles) 화면에서 쓰는 업체 심사 상태 문구입니다(서버 호출 없음).
 * 상태 값은 GET /api/sellers/me 응답의 status(PENDING·APPROVED·REJECTED·SUSPENDED)를 따릅니다.
 */
const STATUS = {
  PENDING: {
    label: '심사 중',
    guide:
      '운영자가 사업자 정보를 확인하고 있습니다. 승인되면 업체 화면을 이용할 수 있습니다.',
  },
  APPROVED: {
    label: '승인 완료',
    guide: '업체 화면에서 브랜드를 등록하고 캠페인을 열 수 있습니다.',
  },
  REJECTED: {
    label: '반려',
    guide:
      '신청이 반려되었습니다. 사유 확인이나 재신청은 고객센터 문의로 요청해 주세요.',
  },
  SUSPENDED: {
    label: '이용 정지',
    guide:
      '업체 활동이 정지된 상태입니다. 자세한 내용은 고객센터로 문의해 주세요.',
  },
}

export function sellerStatusLabel(status) {
  return STATUS[status]?.label || '상태 확인 필요'
}

export function sellerStatusGuide(status) {
  return (
    STATUS[status]?.guide ||
    '상태를 확인하지 못했습니다. 고객센터로 문의해 주세요.'
  )
}

/**
 * /roles 화면의 업체 영역에 보여줄 버튼을 정합니다.
 * - profile: 업체 신청 기록(없으면 null), failed: 조회 실패 여부.
 * - 승인된 업체만 업체 화면 버튼을 주 버튼으로 두고, 아직 신청 전이면 업체 신청을 주 버튼으로 둡니다.
 */
export function businessEntry(profile, failed = false) {
  if (failed)
    return {
      summary: '업체 신청 상태를 확인하지 못했습니다.',
      primary: { to: '/seller/apply', label: '업체 신청 상태 확인' },
    }
  if (!profile)
    return {
      summary: '아직 업체 신청 기록이 없습니다.',
      primary: { to: '/seller/apply', label: '업체 신청하기' },
    }
  if (profile.status === 'APPROVED')
    return {
      summary: `업체 승인 완료 · ${profile.brandName || profile.businessName || '내 업체'}`,
      primary: { to: '/seller/dashboard', label: '업체 화면으로 이동' },
      secondary: { to: '/seller/apply', label: '신청 정보 보기' },
    }
  return {
    summary: `업체 신청 상태: ${sellerStatusLabel(profile.status)}`,
    primary: { to: '/seller/apply', label: '신청 상태 확인' },
  }
}
