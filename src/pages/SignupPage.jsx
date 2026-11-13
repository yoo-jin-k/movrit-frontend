/**
 * 기본 회원 정보로 가입하고 선택한 이용 목적에 맞는 로그인 후 경로를 전달합니다.
 * 업체 선택은 안내 경로에만 쓰며 가입 요청에 업체 권한을 부여하는 값으로 보내지 않습니다.
 * 업체 안내 한 줄: 가입 후 업체 신청 → 운영자 심사 순서를 알려 주고, 이미 회원인 업체는 바로 업체 신청으로 갈 수 있게 합니다.
 * 가입 유형은 라디오 버튼 카드로 고르며(화살표 키로 이동), 고른 카드는 테두리·배경·체크 표시로 구분합니다.
 * 휴대폰 번호는 숫자만 입력하면 하이픈을 자동으로 붙이고, 서버 규칙에 맞는 010-1234-5678 모양으로 보냅니다.
 * 변경 이력: 선택한 유형이 눈에 잘 띄지 않고 번호에 하이픈을 직접 입력해야 함
 *           → 선택 카드 강조·hover/focus 구분, 휴대폰 번호 자동 하이픈(signupFormModel).
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../api/memberApi'
import { normalizeMemberNickname } from '../features/membership/memberNickname'
import CommonLayout from '../components/layout/CommonLayout'
import FormAlert from '../components/ui/FormAlert'
import PasswordField from '../components/ui/PasswordField'
import {
  signupPhoneError,
  signupPhoneInput,
  signupPhonePayload,
} from '../features/auth/signupFormModel'
import {
  SIGNUP_OPTIONS,
  signupDestination,
} from '../features/membership/signupOptions'

function SignupPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    nickname: '',
    phone: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [role, setRole] = useState('USER')
  // 휴대폰 번호 형식 안내는 칸을 벗어날 때(blur) 보여 주고, 다시 입력하면 바로 지웁니다.
  const [phoneTouched, setPhoneTouched] = useState(false)
  const phoneProblem = phoneTouched ? signupPhoneError(form.phone) : ''

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm({
      ...form,
      [name]: name === 'phone' ? signupPhoneInput(value) : value,
    })
    if (name === 'phone') setPhoneTouched(false)
  }

  // 가입 요청은 기본 회원 정보만 전송합니다. 이용 목적은 성공 후 로그인 화면에 넘길 복귀 경로로만 사용합니다.
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!form.name.trim()) {
      setSubmitError('이름을 입력해 주세요.')
      return
    }
    const phoneMessage = signupPhoneError(form.phone)
    if (phoneMessage) {
      setPhoneTouched(true)
      setSubmitError('')
      return
    }
    let nickname
    try {
      nickname = normalizeMemberNickname(form.nickname)
    } catch (cause) {
      setSubmitError(cause.message)
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      await signup({
        ...form,
        nickname,
        phone: signupPhonePayload(form.phone),
      })

      // 회원가입 후 로그인하며 업체 선택은 권한 부여가 아닌 업체 신청 화면 안내로 사용합니다.
      // 완료 안내는 브라우저 알림창 대신 로그인 카드 상단 안내 문구(sessionNotice)로 전달합니다.
      navigate('/login', {
        replace: true,
        state: {
          returnTo: signupDestination(role),
          sessionNotice: '회원가입이 완료되었습니다. 로그인해 주세요.',
        },
      })
    } catch (error) {
      setSubmitError(
        error.response?.status === 409
          ? '이미 사용 중인 이메일 또는 닉네임입니다. 입력 내용을 확인해 주세요.'
          : '회원가입에 실패했습니다. 입력 내용을 확인해 주세요.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <CommonLayout title="회원가입" className="common-signup-page">
      <h2 id="signup-role-heading" className="common-role-heading">
        어떻게 MOVRIT을 사용하실래요?
      </h2>
      <div
        className="common-role-grid common-role-grid--membership signup-role-group"
        role="radiogroup"
        aria-labelledby="signup-role-heading"
      >
        {SIGNUP_OPTIONS.map(({ id, title, description, detail }) => {
          const selected = role === id
          return (
            <label
              key={id}
              className={`signup-role-option${selected ? ' is-selected' : ''}`}
            >
              <input
                className="visually-hidden"
                type="radio"
                name="signup-role"
                value={id}
                checked={selected}
                onChange={() => setRole(id)}
                aria-labelledby={`signup-role-${id}-title`}
                aria-describedby={`signup-role-${id}-desc`}
              />
              <span className="signup-role-option__check" aria-hidden="true">
                <svg
                  viewBox="0 0 20 20"
                  width="14"
                  height="14"
                  focusable="false"
                >
                  <path
                    d="M4.5 10.5l3.5 3.5 7.5-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <strong
                id={`signup-role-${id}-title`}
                className="signup-role-option__title"
              >
                {title}
              </strong>
              <span id={`signup-role-${id}-desc`}>
                <span className="signup-role-option__desc">{description}</span>{' '}
                <span className="signup-role-option__detail">{detail}</span>
              </span>
              <span className="signup-role-option__state" aria-hidden="true">
                {selected ? '선택됨' : '선택하기'}
              </span>
            </label>
          )
        })}
      </div>
      <aside className="common-role-note">
        <strong>
          사용자는 별도 인플루언서 가입 없이 캠페인에 참여할 수 있습니다.
        </strong>
        <p>
          신청 가능 여부는 이메일 인증과 각 캠페인의 참여 조건에 따라
          결정됩니다.
        </p>
        <small>
          업체 기능은 업체 정보 등록과 별도 심사 후 이용할 수 있습니다.
        </small>
        <p className="common-role-business">
          업체로 가입하시면 가입 후 업체 신청 화면으로 이어지며, 사업자 정보를
          등록하고 운영자 심사를 마치면 캠페인을 등록하실 수 있습니다. 이미
          회원이신가요? <Link to="/seller/apply">업체 신청하기 →</Link>
        </p>
      </aside>
      <form className="common-card common-signup-form" onSubmit={handleSubmit}>
        <h2>가입 정보 입력</h2>
        <label className="common-field">
          이메일
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
          />
        </label>
        <PasswordField
          label="비밀번호"
          name="password"
          required
          minLength={8}
          maxLength={100}
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          aria-describedby="signup-password-help"
        >
          <small id="signup-password-help" className="common-field__help">
            8~100자로 입력해 주세요.
          </small>
        </PasswordField>
        <label className="common-field">
          이름
          <input
            type="text"
            name="name"
            required
            maxLength={50}
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
          />
        </label>
        <label className="common-field">
          닉네임
          <input
            name="nickname"
            autoComplete="nickname"
            required
            maxLength={20}
            value={form.nickname}
            onChange={handleChange}
            aria-describedby="signup-nickname-help"
          />
        </label>
        <small id="signup-nickname-help" className="common-field__help">
          2~20자의 한글, 영문, 숫자, 밑줄과 공백으로 입력해 주세요.
        </small>
        <label className="common-field">
          휴대폰번호 (선택)
          <input
            type="tel"
            name="phone"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={13}
            placeholder="01012345678"
            value={form.phone}
            onChange={handleChange}
            onBlur={() => setPhoneTouched(true)}
            aria-invalid={Boolean(phoneProblem) || undefined}
            aria-describedby={
              phoneProblem
                ? 'signup-phone-help signup-phone-error'
                : 'signup-phone-help'
            }
          />
        </label>
        {/* UI점검: 핸드폰번호는 - 입력안하게 했음해 사용자가 편하게, 안내… (메모 뒷부분이 잘려 어떤 안내 문구인지 확인 필요. 지금은 닉네임·비밀번호·휴대폰 입력 안내만 칸 아래로 정리함) */}
        <small id="signup-phone-help" className="common-field__help">
          숫자만 입력하면 하이픈(-)은 자동으로 들어갑니다.
        </small>
        <FormAlert id="signup-phone-error">{phoneProblem}</FormAlert>
        <FormAlert>{submitError}</FormAlert>
        <button className="common-button" type="submit" disabled={submitting}>
          {submitting ? '가입 중...' : '회원가입'}
        </button>
      </form>
    </CommonLayout>
  )
}

export default SignupPage
