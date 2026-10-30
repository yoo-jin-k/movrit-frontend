/**
 * 업체 주문·배송·정산·리뷰를 함께 조회하고 배송 처리와 리뷰 답글을 제공합니다.
 * 배송 명령과 답글은 서버 처리 후 전체 목록을 재조회하며 실패를 완료 상태로 바꾸지 않습니다.
 */
import { useEffect, useState } from 'react'
import {
  createShipment,
  deliverShipment,
  getSellerOrders,
  getSettlements,
  getShipments,
  prepareShipment,
  shipShipment,
} from '../api/commerceApi'
import { getSellerReviews, replyReview } from '../api/reviewApi'

const labels = {
  PAID: '결제 완료',
  PREPARING: '배송 준비',
  SHIPPED: '배송 중',
  DELIVERED: '배송 완료',
  READY: '배송 등록',
  PENDING: '정산 대기',
  CONFIRMED: '정산 확정',
}

function SellerOperationsPage() {
  const [orders, setOrders] = useState([])
  const [shipments, setShipments] = useState([])
  const [settlements, setSettlements] = useState([])
  const [reviews, setReviews] = useState([])

  const load = async () => {
    const [o, s, t, r] = await Promise.all([
      getSellerOrders(),
      getShipments(),
      getSettlements(),
      getSellerReviews(),
    ])
    setOrders(o)
    setShipments(s)
    setSettlements(t)
    setReviews(r)
  }

  useEffect(() => {
    Promise.all([
      getSellerOrders(),
      getShipments(),
      getSettlements(),
      getSellerReviews(),
    ])
      .then(([o, s, t, r]) => {
        setOrders(o)
        setShipments(s)
        setSettlements(t)
        setReviews(r)
      })
      .catch(() => alert('운영 정보를 불러오지 못했습니다.'))
  }, [])

  const shipmentFor = (orderId) => shipments.find((s) => s.orderId === orderId)
  // 배송 처리나 답글 저장 뒤 운영 목록을 다시 읽습니다. 일부 조회 실패도 완료 안내로 숨기지 않고 오류 안내로 전달합니다.
  const action = async (job) => {
    try {
      await job()
      await load()
    } catch (e) {
      alert(e.response?.data?.message || '처리에 실패했습니다.')
    }
  }
  // 택배사와 운송장 번호가 입력된 경우에만 발송 명령을 실행합니다. 실제 배송 추적 조회와는 별개입니다.
  const ship = (shipment) => {
    const courierCode = prompt(
      '택배사 코드를 입력해 주세요.',
      shipment.courierCode || 'CJ',
    )
    const trackingNumber = courierCode && prompt('운송장 번호를 입력해 주세요.')
    if (trackingNumber)
      action(() => shipShipment(shipment.id, { courierCode, trackingNumber }))
  }
  const reply = (review) => {
    const text = prompt(
      '구매자 리뷰에 남길 답글을 입력해 주세요.',
      review.sellerReply || '',
    )
    if (text?.trim()) action(() => replyReview(review.id, text.trim()))
  }

  return (
    <main>
      <h1>주문 · 배송 · 정산 운영</h1>
      <h2>판매 주문</h2>
      {orders.length === 0 ? (
        <p>판매 주문이 없습니다.</p>
      ) : (
        orders.map((o) => {
          const s = shipmentFor(o.id)
          return (
            <section key={o.id}>
              <b>{o.orderNumber}</b> · {labels[o.status] || o.status}
              <p>
                {o.receiverName} / {o.address1} {o.address2}
              </p>
              {o.status === 'PAID' && !s && (
                <button onClick={() => action(() => createShipment(o.id))}>
                  배송 등록
                </button>
              )}
              {s?.status === 'READY' && (
                <button onClick={() => action(() => prepareShipment(s.id))}>
                  상품 준비 시작
                </button>
              )}
              {s?.status === 'PREPARING' && (
                <button onClick={() => ship(s)}>발송 처리</button>
              )}
              {s?.status === 'SHIPPED' && (
                <button onClick={() => action(() => deliverShipment(s.id))}>
                  배송 완료
                </button>
              )}
              {s && (
                <small>
                  {' '}
                  배송 상태: {labels[s.status] || s.status}{' '}
                  {s.trackingNumber || ''}
                </small>
              )}
              <hr />
            </section>
          )
        })
      )}
      <h2>구매 리뷰</h2>
      {reviews.length === 0 ? (
        <p>아직 등록된 리뷰가 없습니다.</p>
      ) : (
        reviews.map((review) => (
          <section key={review.id}>
            <b>{review.productName}</b> · {'★'.repeat(review.rating)}
            <p>
              {review.memberName}: {review.content}
            </p>
            {review.sellerReply && <p>내 답글: {review.sellerReply}</p>}
            <button onClick={() => reply(review)}>
              {review.sellerReply ? '답글 수정' : '답글 달기'}
            </button>
            <hr />
          </section>
        ))
      )}
      <h2>정산</h2>
      <p>구매 확정이 끝나면 관리자가 결제·환불 내역으로 정산액을 계산합니다.</p>
      {settlements.length === 0 ? (
        <p>생성된 정산이 없습니다.</p>
      ) : (
        settlements.map((s) => (
          <section key={s.id}>
            <b>{s.settlementNumber}</b> · {labels[s.status] || s.status}
            <p>
              총매출 {Number(s.grossAmount).toLocaleString()} · 환불{' '}
              {Number(s.refundAmount).toLocaleString()} · 수수료{' '}
              {Number(s.platformFeeAmount).toLocaleString()}
            </p>
            <p>
              순정산액{' '}
              <b>
                {Number(s.netAmount).toLocaleString()} {s.currency}
              </b>
            </p>
            <hr />
          </section>
        ))
      )}
    </main>
  )
}
export default SellerOperationsPage
