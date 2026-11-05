/**
 * 서버가 제공한 참여 방식·질문·동의 문서로 실제 신청 요청을 구성합니다.
 * 충돌 이후에는 다시 확인하도록 막으며 개인정보는 컴포넌트 메모리에만 둡니다.
 */
import { fulfillmentLabel } from '../purchaseReview/purchaseReviewModel'
import { participationError } from './participationError'
import { applicationPayload } from './applicationPayload'
import { formatContactPhone } from '../membership/phoneVerificationModel'
import { useState } from 'react'
import api from '../../api/axios'

// 실제 신청 DTO에 맞춰 입력을 구성하며, 개인정보는 저장소에 남기지 않습니다.
export default function LiveApplicationForm({
  campaignId,
  form,
  requirement,
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
  // 현재 폼·조건 버전을 포함해 신청하고 201 및 신청 ID가 확인된 경우에만 완료 콜백을 호출합니다.
  // 409는 폼을 잠그며 그 외 오류도 성공으로 처리하지 않고 신청 내역 확인 안내를 표시합니다.
  const submit = async (event) => {
    event.preventDefault()
    if (busy || conflict) return
    setBusy(true)
    setError('')
    try {
      const { data, status } = await api.post(
        `/campaigns/${campaignId}/applications`,
        applicationPayload(
          form,
          { type, message, contact, answers, consents },
          requirement,
        ),
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
    <form
      className="live-application-form application-fieldset"
      onSubmit={submit}
    >
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
                {fulfillmentLabel(value)}
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
                  setContact((old) => ({
                    ...old,
                    // 연락처는 입력하는 대로 010-1234-5678 모양으로 맞춰 저장합니다.
                    [key]:
                      key === 'recipientPhone'
                        ? formatContactPhone(e.target.value)
                        : e.target.value,
                  }))
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
              <span>
                {d.required ? '[필수]' : '[선택]'} {d.title}에 동의합니다.
              </span>
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
