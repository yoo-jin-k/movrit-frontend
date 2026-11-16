/**
 * 본인 주문을 표시용 상태로 정규화하여 탭별로 보여줍니다.
 * 서버의 빈 응답과 조회 실패를 예시 주문으로 대체하지 않습니다.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrders } from '../api/commerceApi'
import BuyerLayout, { BuyerCard } from '../components/buyer/BuyerLayout'
import {
  adaptOrderSummary,
  filterOrders,
  ORDER_FILTERS,
} from '../features/orders/orderModel'

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [filter, setFilter] = useState('전체')

  // 서버 응답만 목록으로 사용하며, 조회 실패 시 이전 주문을 남기지 않습니다.
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
  // 표시 형식과 필터 규칙은 화면 렌더링과 분리해 같은 입력에 같은 결과를 만듭니다.
  const shown = filterOrders(orders.map(adaptOrderSummary), filter)

  return (
    <BuyerLayout title="주문 내역">
      <div className="buyer-chip-row buyer-order-filters">
        {ORDER_FILTERS.map((label) => (
          <button
            className={filter === label ? 'is-active' : ''}
            onClick={() => setFilter(label)}
            key={label}
          >
            {label}
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
        {shown.map((order) => (
          <BuyerCard key={order.id} className="buyer-order-row">
            <div>
              <h2>{order.title}</h2>
              <strong>{order.status}</strong>
              <time>{order.date}</time>
            </div>
            <b>{order.amount}</b>
            <Link
              className="buyer-v2-button buyer-v2-button--secondary"
              to={`/orders/${order.id}`}
            >
              상세 보기
            </Link>
          </BuyerCard>
        ))}
      </div>
    </BuyerLayout>
  )
}
