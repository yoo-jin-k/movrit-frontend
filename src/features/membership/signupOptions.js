/**
 * 가입 화면의 이용 목적과 로그인 후 안내 경로를 정의합니다.
 * 업체 이용 목적을 선택해도 즉시 업체·운영자 권한이 부여되지는 않습니다.
 */
// 가입 선택은 이용 목적이며 업체·운영자 권한을 직접 부여하지 않습니다.
export const SIGNUP_OPTIONS = [
  {
    id: 'USER',
    title: '사용자',
    description: '관심 있는 캠페인을 둘러보고 체험에 참여하세요.',
    detail: '캠페인 신청 · 찜 · 알림',
  },
  {
    id: 'SELLER',
    title: '업체',
    description: '브랜드 캠페인을 등록하고 참여자와 협업하세요.',
    detail: '가입 후 업체 정보 등록 및 심사',
  },
]
export function signupDestination(intent) {
  return intent === 'SELLER' ? '/seller/apply' : '/home'
}
