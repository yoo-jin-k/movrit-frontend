/**
 * 업체 '환급 관리' 화면입니다(/seller/paybacks).
 * 구매평 캠페인 참여자별로 구매 인증(주문번호·결제 금액)과 환급 상태를 한눈에 봅니다.
 * - 환급 가능: 구매평이 승인되어 완료되었고 아직 환급 전인 참여자입니다. 직접 송금한 뒤 참여자 상세에서 '환급 완료'를 기록합니다.
 * - MOVRIT은 결제·송금을 하지 않습니다.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import useBusinessList from './useBusinessList'
import { ListState, PageHeader } from './BusinessUi'
import { dateLabel, statusNames } from './businessModel'
import { won } from '../purchaseReview/purchaseReviewModel'

const PAYBACK_LABELS = {
  NO_PROOF: '구매 인증 전',
  PENDING: '환급 대기',
  PAID: '환급 완료',
}
const FILTERS = [
  ['', '전체'],
  ['PAYABLE', '환급 가능'],
  ['PENDING', '환급 대기'],
  ['PAID', '환급 완료'],
  ['NO_PROOF', '구매 인증 전'],
]

export default function BusinessPaybacks() {
  const state = useBusinessList('/campaigns/purchase-paybacks')
  const [filter, setFilter] = useState('')
  const rows = (state.data || []).filter((row) =>
    !filter
      ? true
      : filter === 'PAYABLE'
        ? row.payable
        : row.paybackStatus === filter,
  )
  const payable = (state.data || []).filter((row) => row.payable)
  const total = payable.reduce((sum, row) => sum + (row.paybackAmount || 0), 0)
  return (
    <>
      <PageHeader
        title="환급 관리"
        description="구매평 캠페인 참여자의 구매 인증과 환급 상태를 확인하세요."
      />
      <p className="business-info">
        환급은 브랜드가 참여자에게 직접 보내고, 보낸 뒤 참여자 상세에서
        &apos;환급 완료&apos;를 기록해 주세요. MOVRIT은 결제·송금을 대신하지
        않습니다.
      </p>
      <p className="business-recruitment" role="status">
        <strong>환급 가능 {payable.length}명</strong>
        <span>합계 {won(total)}</span>
      </p>
      <div className="business-filters">
        <select
          aria-label="환급 상태 필터"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {FILTERS.map(([value, label]) => (
            <option key={label} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button onClick={state.reload}>새로고침</button>
      </div>
      <section className="business-panel">
        <ListState state={state}>
          {rows.length ? (
            <div className="business-table-scroll">
              <table className="participants-table">
                <thead>
                  <tr>
                    <th>참여자</th>
                    <th>캠페인</th>
                    <th>진행</th>
                    <th>주문번호</th>
                    <th>결제 금액</th>
                    <th>환급액</th>
                    <th>환급 상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.applicationId}>
                      <td data-label="참여자">{row.creatorNickname}</td>
                      <td data-label="캠페인">{row.campaignTitle}</td>
                      <td data-label="진행">
                        {statusNames[row.applicationStatus]}
                      </td>
                      <td data-label="주문번호">{row.orderNumber || '-'}</td>
                      <td data-label="결제 금액">
                        {row.paidAmount == null ? '-' : won(row.paidAmount)}
                      </td>
                      <td data-label="환급액">
                        {row.paybackAmount == null
                          ? '-'
                          : won(row.paybackAmount)}
                      </td>
                      <td data-label="환급 상태">
                        {row.payable ? (
                          <strong>환급 가능</strong>
                        ) : (
                          PAYBACK_LABELS[row.paybackStatus]
                        )}
                        {row.paybackPaidAt && (
                          <small> · {dateLabel(row.paybackPaidAt)}</small>
                        )}
                      </td>
                      <td data-label="관리">
                        <Link
                          className="business-link"
                          to={`/seller/participants?campaignId=${row.campaignId}&applicationId=${row.applicationId}`}
                        >
                          참여자 상세 →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="business-empty">조건에 맞는 참여자가 없습니다.</div>
          )}
        </ListState>
      </section>
    </>
  )
}
