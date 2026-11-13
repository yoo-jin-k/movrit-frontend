/**
 * 참여자 '내 캠페인'에서 선정 전(접수) 신청 내용을 고치는 영역입니다.
 * - 신청 메시지, 배송지(배송형), 신청서 질문 답변을 고칠 수 있습니다. 참여 방식과 동의는 바꿀 수 없습니다.
 * - 업체가 그사이 신청서를 바꿨다면 서버가 409로 알려 주고, 최신 신청서를 다시 불러옵니다.
 * - 고치면 브랜드에 알림이 갑니다.
 */
import { useEffect, useState } from 'react'
import { readCampaignForm } from '../../api/campaignReadApi'
import { reviseApplication } from '../../api/participationApi'
import { formatContactPhone } from '../membership/phoneVerificationModel'

const CONTACT_FIELDS = [
  ['recipientName', '수령인'],
  ['recipientPhone', '연락처'],
  ['postalCode', '우편번호'],
  ['address1', '주소'],
  ['address2', '상세주소 (선택)'],
]

export default function ApplicationEditPanel({ application, onSaved }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(null)
  const [message, setMessage] = useState(application.message || '')
  const [contact, setContact] = useState(application.shippingContact || {})
  const [answers, setAnswers] = useState(() =>
    Object.fromEntries(
      (application.answers || []).map((a) => [a.questionId, a.value || '']),
    ),
  )
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!open) return undefined
    const controller = new AbortController()
    readCampaignForm(application.campaignId, controller.signal)
      .then(setForm)
      .catch(() => {
        if (!controller.signal.aborted)
          setError('신청서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      })
    return () => controller.abort()
  }, [open, application.campaignId, attempt])

  const delivery = application.fulfillmentType === 'DELIVERY'

  const save = async (event) => {
    event.preventDefault()
    if (busy || !form) return
    if (!message.trim()) {
      setError('신청 메시지를 입력해 주세요.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await reviseApplication(application.id, {
        message: message.trim(),
        expectedFormVersion: form.version,
        shippingContact: delivery ? contact : null,
        answers: (form.questions || []).map((q) => ({
          questionId: q.id,
          value: answers[q.id] ?? '',
        })),
      })
      setNotice('신청 내용을 고쳤습니다. 브랜드에 알림을 보냈습니다.')
      setOpen(false)
      onSaved?.()
    } catch (failure) {
      setError(
        failure.response?.data?.detail ||
          '신청 내용을 고치지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
      // 신청서가 바뀌었으면 최신 신청서를 다시 불러옵니다.
      if (failure.response?.status === 409) setAttempt((value) => value + 1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className="campaign-workspace__section application-edit"
      aria-label="신청 내용 수정"
    >
      <h2>신청 내용</h2>
      {!open ? (
        <>
          <p className="application-edit__message">{application.message}</p>
          <p>선정 결과가 나오기 전까지 신청 내용을 고치실 수 있습니다.</p>
          <button type="button" onClick={() => setOpen(true)}>
            신청 내용 고치기
          </button>
        </>
      ) : !form ? (
        !error && <p role="status">신청서를 불러오고 있습니다.</p>
      ) : (
        <form className="application-edit__form" onSubmit={save}>
          <label>
            신청 메시지
            <textarea
              rows={4}
              maxLength={2000}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          {delivery &&
            CONTACT_FIELDS.map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type={key === 'recipientPhone' ? 'tel' : 'text'}
                  required={key !== 'address2'}
                  value={contact[key] || ''}
                  onChange={(e) =>
                    setContact((current) => ({
                      ...current,
                      // 연락처는 신청서와 같이 하이픈 모양으로 맞춥니다.
                      [key]:
                        key === 'recipientPhone'
                          ? formatContactPhone(e.target.value)
                          : e.target.value,
                    }))
                  }
                />
              </label>
            ))}
          {(form.questions || []).map((q) => (
            <label key={q.id}>
              {q.label}
              {q.required ? ' (필수)' : ' (선택)'}
              {q.type === 'SINGLE_CHOICE' ? (
                <select
                  required={q.required}
                  value={answers[q.id] || ''}
                  onChange={(e) =>
                    setAnswers((current) => ({
                      ...current,
                      [q.id]: e.target.value,
                    }))
                  }
                >
                  <option value="">선택해 주세요</option>
                  {(q.options || []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : q.type === 'TEXTAREA' ? (
                <textarea
                  rows={3}
                  required={q.required}
                  maxLength={q.maxLength || undefined}
                  value={answers[q.id] || ''}
                  onChange={(e) =>
                    setAnswers((current) => ({
                      ...current,
                      [q.id]: e.target.value,
                    }))
                  }
                />
              ) : (
                <input
                  required={q.required}
                  maxLength={q.maxLength || undefined}
                  value={answers[q.id] || ''}
                  onChange={(e) =>
                    setAnswers((current) => ({
                      ...current,
                      [q.id]: e.target.value,
                    }))
                  }
                />
              )}
            </label>
          ))}
          <div className="application-edit__actions">
            <button type="submit" disabled={busy}>
              {busy ? '저장 중…' : '고친 내용 저장'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              취소
            </button>
          </div>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
    </section>
  )
}
