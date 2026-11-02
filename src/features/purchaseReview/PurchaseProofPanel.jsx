/**
 * 참여자 '내 캠페인'의 구매 인증·환급 상태 영역입니다(구매평 캠페인만).
 * - 참여 중이면 주문번호·결제 금액·주문 내역 캡처로 구매 인증을 제출합니다. 처음 제출하면 구매평 링크를 제출할 수 있게 됩니다.
 * - 환급 전까지는 다시 제출해 고칠 수 있습니다.
 * - 구매평이 승인되어 완료되면 브랜드의 환급 완료 여부를 보여줍니다.
 */
import { useEffect, useRef, useState } from 'react'
import {
  readPurchaseProof,
  submitPurchaseProof,
} from '../../api/purchaseReviewApi'
import PurchaseEvidenceImage from './PurchaseEvidenceImage'
import { PAYBACK_LABELS, purchaseProofError, won } from './purchaseReviewModel'
import { workspaceTime } from '../membership/campaignWorkspaceModel'
import './purchaseReview.css'

const EDITABLE = ['ACTIVE', 'REVISION_REQUESTED']

export default function PurchaseProofPanel({ application, onReload }) {
  const [proof, setProof] = useState(undefined)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [paidAmount, setPaidAmount] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    readPurchaseProof(application.id, controller.signal)
      .then((value) => setProof(value))
      .catch(() => {
        if (!controller.signal.aborted)
          setLoadError('구매 인증 상태를 불러오지 못했습니다.')
      })
    return () => controller.abort()
  }, [application.id])

  const canSubmit =
    EDITABLE.includes(application.status) && proof?.paybackStatus !== 'PAID'
  const showForm = canSubmit && (proof === null || editing)

  const submit = async (event) => {
    event.preventDefault()
    if (busy) return
    const problem = purchaseProofError({ orderNumber, paidAmount, file })
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError('')
    try {
      const saved = await submitPurchaseProof(application.id, {
        orderNumber,
        paidAmount,
        file,
      })
      const first = !proof
      setProof(saved)
      setEditing(false)
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      setNotice(
        first
          ? '구매 인증을 제출했습니다. 이제 구매평 주소를 제출하실 수 있습니다.'
          : '구매 인증을 고쳐 다시 제출했습니다.',
      )
      if (first) onReload?.()
    } catch (failure) {
      setError(
        failure.response?.data?.detail ||
          '구매 인증을 제출하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className="campaign-workspace__section purchase-proof"
      aria-label="구매 인증과 환급"
    >
      <h2>구매 인증 · 환급</h2>
      {loadError && <p role="alert">{loadError}</p>}
      {proof === undefined && !loadError && (
        <p role="status">구매 인증 상태를 확인하고 있습니다.</p>
      )}
      {proof && (
        <div className="purchase-proof__summary">
          <p>
            <span
              className={`purchase-badge is-${proof.paybackStatus.toLowerCase()}`}
            >
              {PAYBACK_LABELS[proof.paybackStatus]}
            </span>{' '}
            주문번호 <strong>{proof.orderNumber}</strong> · 결제{' '}
            {won(proof.paidAmount)}
          </p>
          <small>
            인증 {workspaceTime(proof.submittedAt)}
            {proof.paybackPaidAt &&
              ` · 환급 기록 ${workspaceTime(proof.paybackPaidAt)}`}
            {proof.paybackNote && ` · ${proof.paybackNote}`}
          </small>
          <PurchaseEvidenceImage
            applicationId={application.id}
            version={proof.submittedAt}
          />
          {proof.paybackStatus === 'PENDING' &&
            (application.status === 'COMPLETED' ? (
              <p>
                구매평이 승인되었습니다. 브랜드가 환급을 진행하면 알림으로 알려
                드립니다.
              </p>
            ) : (
              <p>구매평이 승인되면 브랜드가 환급을 진행합니다.</p>
            ))}
          {canSubmit && !editing && (
            <button type="button" onClick={() => setEditing(true)}>
              구매 인증 고치기
            </button>
          )}
        </div>
      )}
      {proof === null && !canSubmit && (
        <p>참여 중일 때 구매 인증을 제출하실 수 있습니다.</p>
      )}
      {showForm && (
        <form className="purchase-proof__form" onSubmit={submit}>
          <p>
            구매처에서 결제를 마친 뒤 주문번호와 주문 내역 화면 캡처를 올려
            주세요. 캡처에 보이는 연락처·주소는 가리고 올리셔도 됩니다.
          </p>
          <label>
            주문번호
            <input
              required
              maxLength={60}
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
          </label>
          <label>
            실제 결제 금액(원)
            <input
              required
              inputMode="numeric"
              value={paidAmount}
              onChange={(e) =>
                setPaidAmount(e.target.value.replace(/[^\d]/g, ''))
              }
            />
          </label>
          <label>
            주문 내역 캡처 (JPG·PNG, 5MB 이하)
            <input
              ref={fileRef}
              required
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <div className="purchase-proof__actions">
            <button type="submit" disabled={busy}>
              {busy ? '제출 중…' : proof ? '다시 제출' : '구매 인증 제출'}
            </button>
            {proof && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditing(false)}
              >
                취소
              </button>
            )}
          </div>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
    </section>
  )
}
