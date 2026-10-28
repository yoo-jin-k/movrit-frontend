/**
 * 기존 레이아웃의 헤더 위치에서 메인 헤더를 한 번만 렌더링합니다.
 * 로고·검색·메뉴·로그인 표시와 반응형은 같은 컴포넌트에서 관리합니다.
 */
import MainHomeHeader from '../buyer/MainHomeHeader'

export default function CommonHeader() {
  return <MainHomeHeader />
}
