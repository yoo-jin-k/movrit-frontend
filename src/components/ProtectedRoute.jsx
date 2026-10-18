/**
 * 세션에 액세스 토큰이 없으면 로그인 화면으로 이동합니다.
 * 토큰의 존재만 확인하는 진입 보조 장치이며 유효성이나 업체·운영자 권한을 검증하는 서버 인가를 대체하지 않습니다.
 */
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem('accessToken')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
