import { useRef, useState } from 'react'
import { validateApplicationPreview } from './applicationValidation'

const EMPTY_ADDRESS = {
  recipientName: '',
  phone: '',
  postalCode: '',
  addressLine1: '',
  additionalDetailNeeded: false,
  addressLine2: '',
}
const PREVIEW_STATES = {
  ready: '입력 가능 예시',
  identityRequired: '본인인증 미확인',
  mediaExpired: 'SNS 연결 만료',
  unconfigured: '제공자 미구성',
  termsChanged: '조건 버전 변경',
}

// 신청 입력은 모달의 메모리에만 두며 닫을 때 폐기합니다. 인증·동의·저장 성공을 흉내 내지 않습니다.
export default function CampaignApplicationDialog({ item, dialogRef }) {
  const form = item.detail.form
  const [values, setValues] = useState({
    answers: {},
    consents: {},
    deliveryAddress: form.deliveryAddressRequired ? { ...EMPTY_ADDRESS } : null,
  })
  const [errors, setErrors] = useState({})
  const [previewState, setPreviewState] = useState(form.initialPreviewState)
  const [displayedVersion, setDisplayedVersion] = useState(form.termsVersion)
  const [expectedVersion, setExpectedVersion] = useState(form.termsVersion)
  const [result, setResult] = useState('')
  const errorSummary = useRef(null)

  // 문서·조건 버전이 바뀌면 예전 답변과 동의를 그대로 제출할 수 없도록 초기화합니다.
  const reset = () => {
    setValues({
      answers: {},
      consents: {},
      deliveryAddress: form.deliveryAddressRequired ? { ...EMPTY_ADDRESS } : null,
    })
    setErrors({})
    setResult('')
  }
  const updateAddress = (name, value) =>
    setValues((current) => ({
      ...current,
      deliveryAddress: { ...current.deliveryAddress, [name]: value },
    }))
  const updateAnswer = (q, answer) =>
    setValues((current) => ({
      ...current,
      answers: {
        ...current.answers,
        [q.id]: { questionId: q.id, questionVersion: q.version, ...answer },
      },
    }))
  const updateConsent = (document, accepted) =>
    setValues((current) => ({
      ...current,
      consents: {
        ...current.consents,
        [document.documentId]: {
          documentId: document.documentId,
          documentVersionId: document.documentVersionId,
          accepted,
        },
      },
    }))
  const fieldError = (key) =>
    errors[key] ? (
      <p id={`error-${key}`} className="application-field-error">
        {errors[key]}
      </p>
    ) : null

  // 클라이언트 입력 검사와 실제 신청을 분리합니다. 미구성·인증 만료 상태는 통과로 표시하지 않습니다.
  const validate = (event) => {
    event.preventDefault()
    const nextErrors = validateApplicationPreview(
      { ...form, termsVersion: expectedVersion },
      values,
      displayedVersion,
    )
    if (previewState === 'identityRequired')
      nextErrors.identity = '본인인증 상태 확인이 필요합니다.'
    if (previewState === 'mediaExpired')
      nextErrors.media = '필수 SNS 채널의 연결을 갱신해야 합니다.'
    if (previewState === 'unconfigured' || !form.experienceType)
      nextErrors.configuration = '이행 조건 또는 필수 제공자 구성이 필요합니다.'
    if (item.detail.blockingReason) nextErrors.eligibility = item.detail.blockingReason
    setErrors(nextErrors)
    setResult(
      Object.keys(nextErrors).length
        ? ''
        : '입력 항목 검증을 통과했습니다. 실제 인증·동의 저장·신청은 수행되지 않았습니다.',
    )
    if (Object.keys(nextErrors).length) requestAnimationFrame(() => errorSummary.current?.focus())
  }

  return (
    <dialog
      ref={dialogRef}
      className="discovery-dialog application-dialog"
      aria-labelledby="campaign-application-title"
      onClose={reset}
    >
      <form noValidate autoComplete="off" onSubmit={validate}>
        <div className="discovery-dialog__title">
          <h2 id="campaign-application-title">캠페인 신청</h2>
          <button type="button" aria-label="신청창 닫기" onClick={() => dialogRef.current.close()}>
            ×
          </button>
        </div>
        <p>{item.title}</p>
        <p className="discovery-info">
          개발 미리보기입니다. 실제 개인정보나 인증정보를 입력하지 마세요. 입력한 내용은 서버로
          전송하거나 브라우저에 저장하지 않습니다.
        </p>
        <div className="application-version">
          확인 중인 조건 버전 <strong>v{displayedVersion}</strong>
        </div>
        <section className="application-status" aria-label="신청 자격 상태">
          <h3>본인인증 및 참여 채널</h3>
          <p>
            본인인증:{' '}
            <strong>
              {previewState === 'identityRequired'
                ? '미확인 예시'
                : previewState === 'unconfigured'
                  ? '제공자 미구성'
                  : '확인 상태 예시 · 실제 인증 아님'}
            </strong>
          </p>
          {form.requirements.channels.map((channel) => (
            <p key={channel.label}>
              {channel.label}:{' '}
              <strong>
                {previewState === 'mediaExpired'
                  ? '연결 만료 예시 · 갱신 필요'
                  : previewState === 'unconfigured'
                    ? '연결 제공자 미구성'
                    : '채널 연결 상태 예시'}
              </strong>
            </p>
          ))}
          <button
            type="button"
            className="discovery-outline-button"
            onClick={() =>
              setResult('실제 본인인증 및 SNS 연결은 제공자 계약과 API 연결 후 이용할 수 있습니다.')
            }
          >
            인증·채널 연결 안내
          </button>
        </section>
        {form.blockingReasons.map((reason) => (
          <p className="discovery-info" key={reason.code}>
            {reason.message}
          </p>
        ))}
        {item.detail.blockingReason && (
          <p className="application-field-error">{item.detail.blockingReason}</p>
        )}
        {displayedVersion !== expectedVersion && (
          <div className="application-version-alert" role="alert">
            <p>
              캠페인 조건이 v{expectedVersion}로 변경되었습니다. 기존 답변과 동의를 다시 확인해야
              합니다.
            </p>
            <button
              type="button"
              className="discovery-outline-button"
              onClick={() => {
                reset()
                setDisplayedVersion(expectedVersion)
                setPreviewState('ready')
              }}
            >
              최신 조건 다시 확인
            </button>
          </div>
        )}
        {Object.keys(errors).length > 0 && (
          <div ref={errorSummary} tabIndex={-1} className="application-error-summary" role="alert">
            <strong>입력 내용을 확인해 주세요.</strong>
            <ul>
              {Object.entries(errors).map(([key, text]) => (
                <li key={key}>{text}</li>
              ))}
            </ul>
          </div>
        )}
        {form.deliveryAddressRequired && (
          <fieldset className="application-fieldset">
            <legend>
              수령정보 <small>배송형 캠페인</small>
            </legend>
            {[
              ['recipientName', '수령인', 'text'],
              ['phone', '연락처', 'tel'],
              ['postalCode', '우편번호', 'text'],
              ['addressLine1', '주소', 'text'],
            ].map(([key, label, type]) => (
              <label key={key}>
                {label} <span className="application-required">필수</span>
                <input
                  type={type}
                  name={key}
                  required
                  value={values.deliveryAddress[key]}
                  onChange={(event) => updateAddress(key, event.target.value)}
                  aria-invalid={Boolean(errors[key])}
                  aria-describedby={errors[key] ? `error-${key}` : undefined}
                />
                {fieldError(key)}
              </label>
            ))}
            <label className="discovery-checkbox">
              <input
                type="checkbox"
                checked={values.deliveryAddress.additionalDetailNeeded}
                onChange={(event) => updateAddress('additionalDetailNeeded', event.target.checked)}
              />
              상세주소가 필요한 주소입니다.
            </label>
            <label>
              상세주소 {values.deliveryAddress.additionalDetailNeeded ? '(필수)' : '(선택)'}
              <input
                type="text"
                name="addressLine2"
                required={values.deliveryAddress.additionalDetailNeeded}
                value={values.deliveryAddress.addressLine2}
                onChange={(event) => updateAddress('addressLine2', event.target.value)}
                aria-invalid={Boolean(errors.addressLine2)}
              />
              {fieldError('addressLine2')}
            </label>
            <p className="discovery-muted">
              우편번호 검색 제공자는 미정입니다. 현재는 검수용 직접 입력만 제공합니다.
            </p>
          </fieldset>
        )}
        {form.experienceType === 'VISIT' && (
          <p className="discovery-info">방문형 캠페인은 수령인·배송 주소를 입력받지 않습니다.</p>
        )}
        {!form.experienceType && (
          <p className="discovery-info">
            캠페인 이행 유형이 미구성되어 수령정보를 입력받지 않습니다.
          </p>
        )}
        <fieldset className="application-fieldset">
          <legend>캠페인 질문</legend>
          {form.questions.length === 0 && <p>신청 질문이 아직 구성되지 않았습니다.</p>}
          {form.questions.map((q) => (
            <fieldset key={q.id} className="application-question">
              <legend>
                {q.label}{' '}
                <small>
                  {q.required ? '필수' : '선택'} · 질문 v{q.version}
                </small>
              </legend>
              {q.type === 'SHORT_TEXT' ? (
                <>
                  <textarea
                    aria-label={q.label}
                    value={values.answers[q.id]?.text || ''}
                    required={q.required}
                    aria-invalid={Boolean(errors[`question-${q.id}`])}
                    onChange={(event) =>
                      updateAnswer(q, { text: event.target.value, optionIds: [] })
                    }
                  />
                  <small>
                    {Array.from(values.answers[q.id]?.text || '').length} / {q.maxLength}자 · 최소
                    글자 수 조건 없음
                  </small>
                </>
              ) : (
                <>
                  <p className="discovery-muted">
                    {q.type === 'SINGLE_CHOICE'
                      ? '한 항목을 선택해 주세요.'
                      : `${Math.max(q.required ? 1 : 0, q.minSelections)}개 이상 ${q.maxSelections}개 이하로 선택해 주세요.`}
                  </p>
                  {q.options.map((option) => (
                    <label className="discovery-checkbox" key={option.id}>
                      <input
                        type={q.type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                        name={`question-${q.id}`}
                        value={option.id}
                        checked={(values.answers[q.id]?.optionIds || []).includes(option.id)}
                        onChange={(event) => {
                          const selected = values.answers[q.id]?.optionIds || []
                          updateAnswer(q, {
                            text: null,
                            optionIds:
                              q.type === 'SINGLE_CHOICE'
                                ? [option.id]
                                : event.target.checked
                                  ? [...selected, option.id]
                                  : selected.filter((id) => id !== option.id),
                          })
                        }}
                      />
                      {option.label}
                    </label>
                  ))}
                </>
              )}
              {fieldError(`question-${q.id}`)}
            </fieldset>
          ))}
        </fieldset>
        <fieldset className="application-fieldset">
          <legend>문서별 확인</legend>
          <p className="discovery-muted">
            아래 문서는 검수용 예시입니다. 실제 법문이 구성되기 전에는 신청할 수 없습니다.
          </p>
          {form.consents.map((document) => (
            <fieldset key={document.documentId} className="application-consent">
              <legend>
                {document.required ? '[필수]' : '[선택]'} {document.title}
              </legend>
              <details>
                <summary>문서 내용 및 버전 확인</summary>
                <small>
                  문서 {document.documentId} · 버전 {document.documentVersionId} · 검수용 예시
                </small>
                <p>{document.body}</p>
              </details>
              <div>
                {[true, false].map((accepted) => (
                  <label className="discovery-checkbox" key={String(accepted)}>
                    <input
                      type="radio"
                      name={`consent-${document.documentId}`}
                      checked={values.consents[document.documentId]?.accepted === accepted}
                      onChange={() => updateConsent(document, accepted)}
                    />
                    {accepted ? '동의 예시 선택' : '동의하지 않음'}
                  </label>
                ))}
              </div>
              {fieldError(`consent-${document.documentId}`)}
            </fieldset>
          ))}
        </fieldset>
        {result && (
          <p className="discovery-info" role="status">
            {result}
          </p>
        )}
        <button type="submit" className="discovery-outline-button">
          입력 항목 검증 · 미리보기
        </button>
        <button type="button" className="discovery-primary-button" disabled>
          실제 신청은 서비스 연동 후 가능합니다.
        </button>
        {import.meta.env.DEV && (
          <details className="application-qa-controls">
            <summary>QA 상태 미리보기</summary>
            <label>
              상태 선택
              <select
                value={previewState}
                onChange={(event) => {
                  const state = event.target.value
                  setPreviewState(state)
                  setErrors({})
                  setResult('')
                  if (state === 'termsChanged') setExpectedVersion(displayedVersion + 1)
                }}
              >
                {Object.entries(PREVIEW_STATES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <p>이 선택은 실제 인증·SNS 상태를 변경하지 않습니다.</p>
          </details>
        )}
      </form>
    </dialog>
  )
}
