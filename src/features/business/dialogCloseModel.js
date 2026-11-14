/**
 * 업체 상세 창(DetailDialog)의 닫기 규칙입니다.
 * - 바깥(어두운 영역) 클릭·Esc·닫기 버튼 모두 같은 규칙으로 닫습니다.
 * - 저장하지 않은 입력이 있으면 바로 닫지 않고 확인 안내를 띄워, 실수로 바깥을 눌러 입력이 사라지지 않게 합니다.
 */

// 처리 중이면 닫지 않고, 저장하지 않은 입력이 있으면 확인을 거치고, 아니면 바로 닫습니다.
export function closeDecision({ busy = false, unsaved = false } = {}) {
  if (busy) return 'blocked'
  if (unsaved) return 'confirm'
  return 'close'
}

// 클릭 좌표가 상세 창 사각형 바깥(배경)인지 판단합니다.
// 기본 dialog는 배경을 눌러도 dialog 자신이 클릭 대상이 되므로, 좌표로 창 안팎을 나눕니다.
export function isOutsideRect(rect, x, y) {
  if (!rect) return false
  return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom
}
