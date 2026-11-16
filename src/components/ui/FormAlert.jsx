/**
 * 입력 화면의 오류 안내 한 줄입니다(빨간 글자 + 느낌표 아이콘, role="alert").
 * 색만으로 구분하지 않도록 아이콘을 함께 보여 주고, 화면 읽기 프로그램에는 바로 읽힙니다.
 * 내용이 없으면 아무것도 그리지 않습니다.
 */
function FormAlert({ id, children }) {
  if (!children) return null
  return (
    <p id={id} className="form-alert" role="alert">
      <svg
        className="form-alert__icon"
        viewBox="0 0 20 20"
        width="18"
        height="18"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="10" cy="10" r="9" fill="currentColor" />
        <path
          d="M10 5.5v5.5"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="10" cy="14.3" r="1.2" fill="#fff" />
      </svg>
      <span>{children}</span>
    </p>
  )
}

export default FormAlert
