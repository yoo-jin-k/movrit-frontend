/**
 * 업체 참여자 상세의 구매 인증 확인·환급 기록 영역입니다(구매평 캠페인만).
 * - 참여자가 낸 주문번호·결제 금액·주문 내역 캡처를 확인합니다.
 * - 구매평 검토가 끝나 '완료'된 참여자에게 환급액을 직접 보낸 뒤 '환급 완료'로 기록합니다(한 번만, 참여자에게 알림).
 */
import { useEffect, useState } from 'react'
import { readPurchaseProof, recordPayback } from '../../api/purchaseReviewApi'
import PurchaseEvidenceImage from './PurchaseEvidenceImage'
import {
  canRecordPayback,
  sellerPaybackLabel,
  won,
} from './purchaseReviewModel'
import './purchaseReview.css'

const dateTime = (value) =>
  value ? String(value).replace('T', ' ').slice(0, 16) : '-'

export default function PurchasePaybackPanel({ application }) {
  const [proof, setProof] = useState(undefined)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    readPurchaseProof(application.id, controller.signal)
      .then((value) => setProof(value))
      .catch(() => {
        if (!controller.signal.aborted)
          setError('구매 인증을 불러오지 못했습니다.')
      })
    return () => controller.abort()
  }, [application.id, application.status])

  const record = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      setProof(await recordPayback(application.id, note))
      setConfirming(false)
      setNotice('환급 완료로 기록하고 참여자에게 알렸습니다.')
    } catch (failure) {
      setError(
        failure.response?.data?.detail || '환급 완료를 기록하지 못했습니다.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="purchase-payback" aria-label="구매 인증과 환급">
      <h3>구매 인증 · 환급</h3>
      {proof === undefined && !error && (
        <p role="status">구매 인증을 확인하고 있습니다.</p>
      )}
      {proof === null && <p>참여자가 아직 구매 인증을 제출하지 않았습니다.</p>}
      {proof && (
        <>
          <p>
            <span
              className={`purchase-badge is-${proof.paybackStatus.toLowerCase()}`}
            >
              {sellerPaybackLabel(application, proof)}
            </span>{' '}
            주문번호 <strong>{proof.orderNumber}</strong> · 결제{' '}
            {won(proof.paidAmount)}
          </p>
          <small>
            인증 {dateTime(proof.submittedAt)}
            {proof.paybackPaidAt &&
              ` · 환급 기록 ${dateTime(proof.paybackPaidAt)}`}
            {proof.paybackNote && ` · ${proof.paybackNote}`}
          </small>
          <PurchaseEvidenceImage
            applicationId={application.id}
            version={proof.submittedAt}
          />
          {proof.paybackStatus === 'PENDING' &&
            application.status !== 'COMPLETED' && (
              <p>구매평 검토가 끝나 완료되면 환급 완료를 기록할 수 있습니다.</p>
            )}
          {canRecordPayback(application, proof) &&
            (confirming ? (
              <div className="purchase-payback__confirm">
                <p>
                  환급액을 참여자에게 직접 보내셨습니까? 기록하면 되돌릴 수
                  없습니다.
                </p>
                <label>
                  메모 (선택)
                  <input
                    maxLength={200}
                    placeholder="예) 11/3 계좌 이체 완료"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </label>
                <button type="button" disabled={busy} onClick={record}>
                  {busy ? '기록 중…' : '환급 완료 기록'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirming(false)}
                >
                  돌아가기
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirming(true)}>
                환급 완료로 기록
              </button>
            ))}
        </>
      )}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
    </section>
  )
}
