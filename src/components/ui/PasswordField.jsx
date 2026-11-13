/**
 * 비밀번호 입력칸과 보기/숨기기 눈 아이콘 버튼을 함께 그리는 공용 입력칸입니다.
 * - 로그인·회원가입·비밀번호 재설정에서 같은 모양과 동작으로 씁니다.
 * - 눈 버튼은 aria-pressed로 보이는 상태를 알리고, 키보드(Tab·Enter·Space)로도 누를 수 있습니다.
 * - label 밖에 버튼을 두어 입력칸 이름에 버튼 이름이 섞이지 않게 합니다.
 * - 나머지 속성(value·onChange·autoComplete·aria-invalid 등)은 input에 그대로 넘깁니다.
 */
import { useId, useState } from 'react'

function EyeIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <path d="M4 4l16 16" />}
    </svg>
  )
}

function PasswordField({ label, id, className = '', children, ...inputProps }) {
  const generatedId = useId()
  const inputId = id || generatedId
  const [visible, setVisible] = useState(false)

  return (
    <div className={`common-field password-field ${className}`.trim()}>
      <label htmlFor={inputId}>{label}</label>
      <div className="password-field__control">
        <input
          {...inputProps}
          id={inputId}
          type={visible ? 'text' : 'password'}
        />
        <button
          type="button"
          className="password-field__toggle"
          aria-label="비밀번호 보기"
          aria-pressed={visible}
          aria-controls={inputId}
          title={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
          onClick={() => setVisible((value) => !value)}
        >
          <EyeIcon open={!visible} />
        </button>
      </div>
      {children}
    </div>
  )
}

export default PasswordField
