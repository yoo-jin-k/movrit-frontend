/**
 * 설정 화면 '로그인 연결' 영역의 표시 모델입니다.
 * 서버가 돌려준 연결 목록을 Google·Kakao 두 줄로 정리하고, 연결 결과 안내 문구를 만듭니다.
 */

// 화면에 보여줄 소셜 로그인 제공자 순서와 이름입니다. 서버 provider 코드와 일치해야 합니다.
export const SOCIAL_PROVIDERS = [
  { code: 'GOOGLE', label: 'Google' },
  { code: 'KAKAO', label: '카카오' },
]

// 연결 목록을 제공자별 상태로 바꿉니다. 목록 형식이 아니면 연결 여부를 추측하지 않고 null을 반환합니다.
export function socialLinkRows(accounts) {
  if (!Array.isArray(accounts)) return null
  return SOCIAL_PROVIDERS.map(({ code, label }) => {
    const account = accounts.find((item) => item?.provider === code)
    return {
      code,
      label,
      linked: Boolean(account),
      email: account?.email || '',
    }
  })
}

// 연결 콜백 결과를 설정 화면 안내 문구로 바꿉니다. 서버 메시지가 있으면 그대로 우선 사용합니다.
export function linkResultNotice({ provider, success, message }) {
  const label =
    SOCIAL_PROVIDERS.find((item) => item.code === provider)?.label || '소셜'
  if (success) return { ok: true, text: `${label} 계정이 연결되었습니다.` }
  return {
    ok: false,
    text: message || `${label} 계정을 연결하지 못했습니다. 다시 시도해 주세요.`,
  }
}
