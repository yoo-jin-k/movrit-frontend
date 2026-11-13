/**
 * 업체 주문·배송·정산·리뷰를 함께 조회하고 배송 처리와 리뷰 답글을 제공합니다(/seller/operations, 승인된 업체).
 * - 사용하는 API: GET /api/orders/seller, /api/shipments/mine, /api/settlements/mine, /api/reviews/seller
 * 배송 명령과 답글은 서버 처리 후 전체 목록을 재조회하며 실패를 완료 상태로 바꾸지 않습니다.
 *
 * 변경 이력(고치기 전 → 고친 후)
 * - 네 요청을 Promise.all로 묶어, 현재 백엔드에 없는 GET /api/reviews/seller(404) 하나 때문에
 *   '운영 정보를 불러오지 못했습니다.' 경고창이 뜨고 주문·배송·정산까지 비어 보임
 *   → 영역별로 결과를 나눠(sellerOperationsModel) 실패한 영역만 안내하고, 404는 '제공하지 않는 기능'으로 표시.
 * - 업체 화면 안에 별도 <main>으로 그려져 다른 업체 화면과 모양이 달랐음 → 업체 공통 머리글·패널 사용.
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
import { PageHeader } from '../features/business/BusinessUi'
import { settleOperations } from '../features/business/sellerOperationsModel'

const labels = {
  PAID: '결제 완료',
  PREPARING: '배송 준비',
  SHIPPED: '배송 중',
  DELIVERED: '배송 완료',
  READY: '배송 등록',
  PENDING: '정산 대기',
  CONFIRMED: '정산 확정',
}

const fetchAll = () =>
  Promise.allSettled([
    getSellerOrders(),
    getShipments(),
    getSettlements(),
    getSellerReviews(),
  ]).then(settleOperations)

function SellerOperationsPage() {
  const [result, setResult] = useState(null)
  const sections = result?.sections
  const orders = sections?.orders.items || []
  const shipments = sections?.shipments.items || []
  const settlements = sections?.settlements.items || []
  const reviews = sections?.reviews.items || []

  const load = async () => setResult(await fetchAll())

  useEffect(() => {
    let active = true
    fetchAll().then((value) => {
      if (active) setResult(value)
    })
    return () => {
      active = false
    }
  }, [])

  // 영역 상태에 맞는 안내 문구입니다. 정상인데 비어 있으면 empty 문구를 씁니다.
  const sectionNote = (key, empty) => {
    const state = sections?.[key].state
    if (!sections) return <p role="status">정보를 불러오고 있습니다.</p>
    if (state === 'unavailable')
      return <p>현재 서버에서 제공하지 않는 기능입니다.</p>
    if (state === 'error')
      return <p role="alert">이 영역의 정보를 불러오지 못했습니다.</p>
    return <p>{empty}</p>
  }

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
    <>
      <PageHeader
        title="주문 · 배송 · 정산 운영"
        description="상품 판매 주문의 배송 처리, 구매 리뷰 답글, 정산 내역을 확인합니다."
      >
        <button type="button" onClick={load}>
          새로고침
        </button>
      </PageHeader>
      {result?.failed.length > 0 && (
        <div className="business-info" role="alert">
          {result.failed.join('·')} 정보를 불러오지 못했습니다. 잠시 후
          새로고침해 주세요.
        </div>
      )}
      <section className="business-panel">
        <h2>판매 주문</h2>
        {orders.length === 0
          ? sectionNote('orders', '판매 주문이 없습니다.')
          : orders.map((o) => {
              const s = shipmentFor(o.id)
              return (
                <div className="operations-row" key={o.id}>
                  <div>
                    <b>{o.orderNumber}</b> · {labels[o.status] || o.status}
                    <p>
                      {o.receiverName} / {o.address1} {o.address2}
                    </p>
                    {s && (
                      <p>
                        배송 상태: {labels[s.status] || s.status}{' '}
                        {s.trackingNumber || ''}
                      </p>
                    )}
                  </div>
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
                </div>
              )
            })}
      </section>
      <section className="business-panel">
        <h2>구매 리뷰</h2>
        {reviews.length === 0
          ? sectionNote('reviews', '아직 등록된 리뷰가 없습니다.')
          : reviews.map((review) => (
              <div className="operations-row" key={review.id}>
                <div>
                  <b>{review.productName}</b> · {'★'.repeat(review.rating)}
                  <p>
                    {review.memberName}: {review.content}
                  </p>
                  {review.sellerReply && <p>내 답글: {review.sellerReply}</p>}
                </div>
                <button onClick={() => reply(review)}>
                  {review.sellerReply ? '답글 수정' : '답글 달기'}
                </button>
              </div>
            ))}
      </section>
      <section className="business-panel">
        <h2>정산</h2>
        <p>
          구매 확정이 끝나면 관리자가 결제·환불 내역으로 정산액을 계산합니다.
        </p>
        {settlements.length === 0
          ? sectionNote('settlements', '생성된 정산이 없습니다.')
          : settlements.map((s) => (
              <div className="operations-row" key={s.id}>
                <div>
                  <b>{s.settlementNumber}</b> · {labels[s.status] || s.status}
                  <p>
                    총매출 {Number(s.grossAmount).toLocaleString()} · 환불{' '}
                    {Number(s.refundAmount).toLocaleString()} · 수수료{' '}
                    {Number(s.platformFeeAmount).toLocaleString()}
                  </p>
                </div>
                <p>
                  순정산액{' '}
                  <b>
                    {Number(s.netAmount).toLocaleString()} {s.currency}
                  </b>
                </p>
              </div>
            ))}
      </section>
    </>
  )
}
export default SellerOperationsPage
