/**
 * 기존 활동 신청 주소를 선택형 활동 프로필 화면으로 연결합니다.
 * 별도 가입 요청을 전송하지 않고 라우트만 교체합니다.
 */
import { Navigate } from 'react-router-dom'
// 기존 주소는 유지하며 별도 인플루언서 가입 대신 선택형 활동 프로필을 안내합니다.
export default function CreatorApplyPage() {
  return <Navigate to="/creator/profile" replace />
}
