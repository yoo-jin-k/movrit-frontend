/** 문의 조회 실패와 빈 내역을 구분하고 중복 접수 및 불명확한 저장 결과의 재전송을 막습니다. */
import { useRef, useState } from 'react'
import { closeInquiry, createInquiry } from '../api/inquiryApi'
import CommonLayout from '../components/layout/CommonLayout'
import useBusinessList from '../features/business/useBusinessList'
import { workspaceTime } from '../features/membership/campaignWorkspaceModel'
const INITIAL = { preorderId: '', category: 'GENERAL', title: '', content: '' }
const CATEGORIES = [
  ['GENERAL', '일반'],
  ['CAMPAIGN', '캠페인'],
  ['ACCOUNT', '계정'],
  ['ORDER', '주문'],
  ['PAYMENT', '결제'],
  ['REFUND', '취소/환불'],
  ['SHIPPING', '배송'],
  ['PREORDER', '프리오더'],
]
export default function InquiriesPage() {
  const state = useBusinessList('/inquiries/mine')
  const [form, setForm] = useState(INITIAL),
    [busy, setBusy] = useState(false),
    [locked, setLocked] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [closing, setClosing] = useState(null)
  const inFlight = useRef(false)
  const submit = async (event) => {
    event.preventDefault()
    if (inFlight.current || locked) return
    if (!form.title.trim() || !form.content.trim()) {
      setError('제목과 내용을 입력해 주세요.')
      return
    }
    const preorderId = form.preorderId ? Number(form.preorderId) : null
    if (
      preorderId !== null &&
      (!Number.isSafeInteger(preorderId) || preorderId <= 0)
    ) {
      setError('관련 프리오더 번호를 확인해 주세요.')
      return
    }
    inFlight.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await createInquiry({
        ...form,
        preorderId,
        title: form.title.trim(),
        content: form.content.trim(),
      })
      setForm(INITIAL)
      setNotice('문의를 등록했습니다. 아래 내역에서 확인해 주세요.')
      state.reload()
    } catch (failure) {
      if (failure.response?.status === 400)
        setError(
          failure.response?.data?.detail || '입력한 문의 정보를 확인해 주세요.',
        )
      else {
        setLocked(true)
        state.reload()
        setError(
          '접수 결과를 확인하지 못했습니다. 아래 내역을 새로 확인한 후 다시 작성해 주세요.',
        )
      }
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  const close = async (id) => {
    if (inFlight.current || closing !== id) return
    inFlight.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await closeInquiry(id)
      setClosing(null)
      setNotice('문의를 종료했습니다.')
      state.reload()
    } catch {
      setClosing(null)
      setError(
        '종료 결과를 확인하지 못했습니다. 최신 내역을 다시 확인해 주세요.',
      )
      state.reload()
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  return (
    <CommonLayout title="고객센터">
      <div className="support-layout">
        <section className="support-categories" aria-label="문의 유형 선택">
          {CATEGORIES.map(([value, label]) => (
            <button
              className="common-button common-button--secondary"
              key={value}
              aria-pressed={form.category === value}
              disabled={busy || locked}
              onClick={() => setForm((old) => ({ ...old, category: value }))}
            >
              {label} 문의
            </button>
          ))}
        </section>
        <form className="common-card support-form" onSubmit={submit}>
          <h2>1:1 문의하기</h2>
          <label className="common-field">
            문의 유형
            <select
              value={form.category}
              disabled={busy || locked}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="common-field">
            관련 프리오더 ID (선택)
            <input
              type="number"
              min="1"
              step="1"
              value={form.preorderId}
              disabled={busy || locked}
              onChange={(e) => setForm({ ...form, preorderId: e.target.value })}
            />
          </label>
          <label className="common-field">
            제목
            <input
              required
              maxLength={200}
              value={form.title}
              disabled={busy || locked}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label className="common-field">
            내용
            <textarea
              required
              maxLength={5000}
              value={form.content}
              disabled={busy || locked}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </label>
          <button className="common-button" disabled={busy || locked}>
            {busy ? '처리 중…' : '문의 접수'}
          </button>
          {locked && !state.loading && !state.error && (
            <button
              className="common-button common-button--secondary"
              type="button"
              onClick={() => {
                setLocked(false)
                setError('')
              }}
            >
              내역 확인 후 작성 계속
            </button>
          )}
        </form>
      </div>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <section className="inquiry-history">
        <h2>내 문의 내역</h2>
        <button
          className="common-button common-button--secondary"
          disabled={busy || state.loading}
          onClick={state.reload}
        >
          내역 새로고침
        </button>
        {state.loading ? (
          <p role="status">내역을 불러오고 있습니다.</p>
        ) : state.error ? (
          <p role="alert">{state.error}</p>
        ) : !state.data.length ? (
          <p>등록한 문의가 없습니다.</p>
        ) : (
          state.data.map((item) => (
            <article key={item.id}>
              <strong>{item.title}</strong>
              <p>
                {{ OPEN: '답변 대기', ANSWERED: '답변 완료', CLOSED: '종료' }[
                  item.status
                ] || '상태 확인 필요'}{' '}
                · {workspaceTime(item.createdAt)}
              </p>
              <p>{item.content}</p>
              {item.answer && (
                <div>
                  <strong>문의 답변</strong>
                  <p>{item.answer}</p>
                  <small>{workspaceTime(item.answeredAt)}</small>
                </div>
              )}
              {item.status !== 'CLOSED' && (
                <button
                  className="common-button common-button--secondary"
                  disabled={busy}
                  onClick={() => setClosing(item.id)}
                >
                  문의 종료
                </button>
              )}
              {closing === item.id && (
                <div>
                  <p>이 문의를 종료하시겠습니까?</p>
                  <button
                    className="common-button common-button--secondary"
                    disabled={busy}
                    onClick={() => close(item.id)}
                  >
                    종료 확정
                  </button>
                  <button
                    className="common-button common-button--secondary"
                    disabled={busy}
                    onClick={() => setClosing(null)}
                  >
                    유지
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </CommonLayout>
  )
}
