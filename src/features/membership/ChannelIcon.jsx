/** 서비스 이름과 함께 사용하는 자체 벡터 아이콘입니다. 외부 사이트 이미지 자산을 가져오지 않습니다. */
export default function ChannelIcon({ type }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      {type === 'INSTAGRAM' ? (
        <>
          <rect x="4" y="4" width="16" height="16" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
        </>
      ) : type === 'YOUTUBE' ? (
        <>
          <rect x="2" y="5" width="20" height="14" rx="4" />
          <path d="m10 9 6 3-6 3z" fill="currentColor" stroke="none" />
        </>
      ) : type === 'CLIP' ? (
        <>
          <path d="m8 16 7-7a3 3 0 0 0-4-4l-7 7a6 6 0 0 0 8 8l8-8a4 4 0 0 0-6-6l-7 7a2 2 0 0 0 3 3l6-6" />
        </>
      ) : (
        <>
          <path d="M4 4h16v12H9l-5 4z" />
          <path d="M8 8h8M8 12h6" />
        </>
      )}
    </svg>
  )
}
