/**
 * 본인 주문을 표시용 상태로 정규화하여 탭별로 보여줍니다.
 * 서버의 빈 응답과 조회 실패를 예시 주문으로 대체하지 않습니다.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrders } from '../api/commerceApi'
import BuyerLayout, { BuyerCard } from '../components/buyer/BuyerLayout'

const labels = {
  PENDING_PAYMENT: '진행중',
  PAID: '결제완료',
  PREPARING: '결제완료',
  SHIPPED: '배송중',
  DELIVERED: '완료',
  CANCELLED: '취소',
  REFUNDED: '취소',
}
export default function MyOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0)
  const [filter, setFilter] = useState('전체')
  useEffect(() => {
    getMyOrders()
      .then((items) => {
        if (!Array.isArray(items)) throw new Error('응답 형식 오류')
        setOrders(items)
        setError('')
      })
      .catch(() => {
        setOrders([])
        setError('주문 내역을 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [attempt])
  const normalized = orders.map((o) => ({
    id: o.id,
    number: o.orderNumber || o.number,
    title: o.preorderTitle || o.title,
    status: labels[o.status] || o.status,
    date: o.createdAt?.slice(0, 10) || o.date,
    amount: o.totalPaymentAmount
      ? `${Number(o.totalPaymentAmount).toLocaleString()}원`
      : o.amount,
  }))
  const shown = useMemo(
    () =>
      filter === '전체'
        ? normalized
        : normalized.filter((o) => o.status === filter),
    [normalized, filter],
  )
  return (
    <BuyerLayout title="주문 내역">
      <div className="buyer-chip-row buyer-order-filters">
        {['전체', '진행중', '결제완료', '배송중', '완료', '취소'].map((x) => (
          <button
            className={filter === x ? 'is-active' : ''}
            onClick={() => setFilter(x)}
            key={x}
          >
            {x}
          </button>
        ))}
      </div>
      <button
        disabled={loading}
        onClick={() => {
          setLoading(true)
          setAttempt((v) => v + 1)
        }}
      >
        새로고침
      </button>
      {loading ? (
        <p role="status">주문을 불러오고 있습니다.</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : !shown.length ? (
        <p>표시할 주문이 없습니다.</p>
      ) : null}
      <div className="buyer-order-list">
        {shown.map((o) => (
          <BuyerCard key={o.id} className="buyer-order-row">
            <div>
              <h2>{o.title}</h2>
              <strong>{o.status}</strong>
              <time>{o.date}</time>
            </div>
            <b>{o.amount}</b>
            <Link
              className="buyer-v2-button buyer-v2-button--secondary"
              to={`/orders/${o.id}`}
            >
              상세 보기
            </Link>
          </BuyerCard>
        ))}
      </div>
    </BuyerLayout>
  )
}
