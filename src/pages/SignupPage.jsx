/**
 * 기본 회원 정보로 가입하고 선택한 이용 목적에 맞는 로그인 후 경로를 전달합니다.
 * 업체 선택은 안내 경로에만 쓰며 가입 요청에 업체 권한을 부여하는 값으로 보내지 않습니다.
 * 업체 안내 한 줄: 가입 후 업체 신청 → 운영자 심사 순서를 알려 주고, 이미 회원인 업체는 바로 업체 신청으로 갈 수 있게 합니다.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../api/memberApi'
import { normalizeMemberNickname } from '../features/membership/memberNickname'
import CommonLayout from '../components/layout/CommonLayout'
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

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm({
      ...form,
      [name]: value,
    })
  }

  // 가입 요청은 기본 회원 정보만 전송합니다. 이용 목적은 성공 후 로그인 화면에 넘길 복귀 경로로만 사용합니다.
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!form.name.trim()) {
      setSubmitError('이름을 입력해 주세요.')
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
      await signup({ ...form, nickname })

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
      <h2 className="common-role-heading">어떻게 MOVRIT을 사용하실래요?</h2>
      <section
        className="common-role-grid common-role-grid--membership"
        aria-label="가입 유형"
      >
        {SIGNUP_OPTIONS.map(({ id, title, description, detail }) => (
          <article key={id} className={role === id ? 'is-selected' : ''}>
            <h3>{title}</h3>
            <p>{description}</p>
            <strong>{detail}</strong>
            <button
              className="common-button"
              type="button"
              aria-pressed={role === id}
              aria-label={`${title} 선택`}
              onClick={() => setRole(id)}
            >
              {role === id ? '선택됨' : '선택'}
            </button>
          </article>
        ))}
      </section>
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
        <label className="common-field">
          비밀번호
          <input
            type="password"
            name="password"
            required
            minLength={8}
            maxLength={100}
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
          />
        </label>
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
        <p id="signup-nickname-help">
          닉네임은 2~20자의 한글, 영문, 숫자, 밑줄과 공백으로 입력해 주세요.
        </p>
        <label className="common-field">
          휴대폰번호
          <input
            type="text"
            name="phone"
            autoComplete="tel"
            maxLength={20}
            pattern="[0-9+\-]{8,20}"
            value={form.phone}
            onChange={handleChange}
          />
        </label>
        <p>비밀번호는 8~100자로 입력해 주세요. 휴대폰번호는 선택 사항입니다.</p>
        {submitError && <p role="alert">{submitError}</p>}
        <button className="common-button" type="submit" disabled={submitting}>
          {submitting ? '가입 중...' : '회원가입'}
        </button>
      </form>
    </CommonLayout>
  )
}

export default SignupPage
