// 가입 선택은 이용 목적이며 업체·운영자 권한을 직접 부여하지 않습니다.
export const SIGNUP_OPTIONS = [
  {
    id: 'USER',
    title: '사용자',
    description: '상품을 둘러보고 관심 있는 캠페인에 참여하세요.',
    detail: '캠페인 · 주문 · 찜 · 알림',
  },
  {
    id: 'SELLER',
    title: '업체',
    description: '상품과 캠페인을 운영하고 사용자와 협업하세요.',
    detail: '가입 후 업체 정보 등록 및 심사',
  },
]
export function signupDestination(intent) {
  return intent === 'SELLER' ? '/seller/apply' : '/home'
}
