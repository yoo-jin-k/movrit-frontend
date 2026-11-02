/** 회원 탈퇴 API입니다. 탈퇴 가능 여부(막는 이유)를 먼저 확인하고, 확인 문구와 함께 탈퇴를 요청합니다. */
import api from './axios'

export const WITHDRAW_CONFIRM_TEXT = '탈퇴합니다'

export async function readWithdrawalEligibility() {
  const { data } = await api.get('/members/me/withdrawal', { timeout: 15000 })
  return data
}

export async function withdrawMember(confirmText) {
  await api.post('/members/me/withdrawal', { confirmText }, { timeout: 15000 })
}
