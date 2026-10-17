import { participationError } from './participationError'
import { applicationPayload } from './applicationPayload'
import { useState } from 'react'
import api from '../../api/axios'

// 실제 신청 DTO에 맞춰 입력을 구성하며, 개인정보는 저장소에 남기지 않습니다.
export default function LiveApplicationForm({
  campaignId,
  form,
  onSubmitted,
  onRefresh,
}) {
  const [type, setType] = useState(form.allowedFulfillmentTypes[0] || '')
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState({})
  const [answers, setAnswers] = useState({})
  const [consents, setConsents] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    if (busy || conflict) return
    setBusy(true)
    setError('')
    try {
      const { data, status } = await api.post(
        `/campaigns/${campaignId}/applications`,
        applicationPayload(form, { type, message, contact, answers, consents }),
        { timeout: 15000 },
      )
      if (status !== 201 || !data?.id)
        throw new Error(
          '신청 결과를 확인할 수 없습니다. 신청 내역을 확인해 주세요.',
        )
      onSubmitted(data)
    } catch (failure) {
      setConflict(failure.response?.status === 409)
      setError(
        participationError(
          failure,
          '신청 결과를 확인하지 못했습니다. 신청 상태를 다시 확인해 주세요.',
        ),
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="application-fieldset" onSubmit={submit}>
      <h3>캠페인 신청서</h3>
      <fieldset disabled={busy || conflict} className="application-fieldset">
        <legend>참여 정보</legend>
        <label>
          참여 방식
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              setContact({})
            }}
            required
          >
            {form.allowedFulfillmentTypes.map((value) => (
              <option key={value} value={value}>
                {value === 'DELIVERY' ? '배송형' : '방문형'}
              </option>
            ))}
          </select>
        </label>
        <label>
          신청 메시지
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        {type === 'DELIVERY' &&
          [
            ['recipientName', '수령인'],
            ['recipientPhone', '연락처'],
            ['postalCode', '우편번호'],
            ['address1', '주소'],
            ['address2', '상세주소 (선택)'],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type={key === 'recipientPhone' ? 'tel' : 'text'}
                required={key !== 'address2'}
                value={contact[key] || ''}
                onChange={(e) =>
                  setContact((old) => ({ ...old, [key]: e.target.value }))
                }
              />
            </label>
          ))}
        {form.questions.map((q) => (
          <label key={q.id}>
            {q.label} ({q.required ? '필수' : '선택'})
            {q.type === 'SINGLE_CHOICE' ? (
              <select
                required={q.required}
                value={answers[q.id] || ''}
                onChange={(e) =>
                  setAnswers((old) => ({ ...old, [q.id]: e.target.value }))
                }
              >
                <option value="">선택해 주세요</option>
                {q.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : q.type === 'TEXTAREA' ? (
              <textarea
                required={q.required}
                maxLength={q.maxLength ?? undefined}
                value={answers[q.id] || ''}
                onChange={(e) =>
                  setAnswers((old) => ({ ...old, [q.id]: e.target.value }))
                }
              />
            ) : (
              <input
                required={q.required}
                maxLength={q.maxLength ?? undefined}
                value={answers[q.id] || ''}
                onChange={(e) =>
                  setAnswers((old) => ({ ...old, [q.id]: e.target.value }))
                }
              />
            )}
          </label>
        ))}
        {form.agreements.map((d) => (
          <div key={d.id}>
            <details>
              <summary>
                {d.title} · {d.version}
              </summary>
              <p style={{ whiteSpace: 'pre-wrap' }}>{d.body}</p>
            </details>
            <label className="discovery-checkbox">
              <input
                type="checkbox"
                required={d.required}
                checked={consents[d.id] === true}
                onChange={(e) =>
                  setConsents((old) => ({ ...old, [d.id]: e.target.checked }))
                }
              />
              {d.required ? '[필수]' : '[선택]'} {d.title}에 동의합니다.
            </label>
          </div>
        ))}
        <button type="submit" className="discovery-primary-button">
          {busy ? '신청 중입니다…' : '신청하기'}
        </button>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      {conflict && (
        <button type="button" onClick={onRefresh}>
          최신 신청 조건 다시 확인
        </button>
      )}
    </form>
  )
}
