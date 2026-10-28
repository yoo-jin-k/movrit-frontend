/** 회원 닉네임을 서버 정책과 같은 표시 형태로 정리합니다. 중복 여부는 서버가 판단합니다. */
export function normalizeMemberNickname(value) {
  const nickname = String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
  if (!/^[가-힣A-Za-z0-9_ ]{2,20}$/.test(nickname)) {
    throw new Error(
      '닉네임은 2~20자의 한글, 영문, 숫자, 밑줄과 공백으로 입력해 주세요.',
    )
  }
  return nickname
}
