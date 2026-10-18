/**
 * 업체 메뉴와 동작에서 사용하는 SVG 경로를 이름으로 선택합니다.
 * 아이콘은 장식 요소이며 버튼이나 링크의 접근 가능한 이름은 사용처가 제공합니다.
 */
const paths = {
  dashboard: 'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
  campaigns: 'M4 4h16v17H4zM8 8h8M8 12h8M8 16h5',
  participants:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  contents: 'M4 3h11l5 5v13H4zM14 3v6h6M8 13h8M8 17h5',
  inbox: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M10 2h4l1 3 3 1 3 3-2 3 2 3-3 3-3 1-1 3h-4l-1-3-3-1-3-3 2-3-2-3 3-3 3-1z',
}
export default function BusinessIcon({ name }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
