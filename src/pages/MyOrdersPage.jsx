import { useEffect, useState } from 'react'
import { approvePayment, cancelOrder, createPayment, getBuyerShipments, getMyOrders, getMyPayments, refundPayment, updateOrderReceiver } from '../api/commerceApi'

const orderLabels = { PENDING_PAYMENT:'결제 대기', PAID:'결제 완료', PREPARING:'배송 준비', SHIPPED:'배송 중', DELIVERED:'배송 완료', CANCELLED:'취소', REFUNDED:'환불' }

function MyOrdersPage() {
    const [orders, setOrders] = useState([])
    const [payments, setPayments] = useState([])
    const [shipments, setShipments] = useState([])
    const load = async () => { const [o, p, s] = await Promise.all([getMyOrders(), getMyPayments(), getBuyerShipments()]); setOrders(o); setPayments(p); setShipments(s) }
    useEffect(() => {
        Promise.all([getMyOrders(), getMyPayments(), getBuyerShipments()])
            .then(([o, p, s]) => { setOrders(o); setPayments(p); setShipments(s) })
            .catch(() => alert('주문 정보를 불러오지 못했어.'))
    }, [])
    const paymentFor = (orderId) => payments.find((p) => p.orderId === orderId)
    const shipmentFor = (orderId) => shipments.find((s) => s.orderId === orderId)
    const editReceiver = async (order) => {
        const receiverName = prompt('받는 사람', order.receiverName)
        if (!receiverName) return
        const receiverPhone = prompt('연락처', order.receiverPhone)
        const postalCode = receiverPhone && prompt('우편번호', order.postalCode || '')
        const address1 = receiverPhone && prompt('주소', order.address1)
        const address2 = address1 && prompt('상세 주소', order.address2 || '')
        if (!receiverPhone || !address1) return
        try { await updateOrderReceiver(order.id, { receiverName, receiverPhone, postalCode, address1, address2 }); await load() }
        catch (error) { alert(error.response?.data?.message || '배송지 변경에 실패했어.') }
    }
    const pay = async (order) => {
        try {
            const payment = paymentFor(order.id) || await createPayment(order.id)
            await approvePayment(payment.id, { paymentKey: `TEST-${crypto.randomUUID()}`, pgProvider: 'TEST', method: 'CARD' })
            await load()
        } catch (error) { alert(error.response?.data?.message || '결제 처리에 실패했어.') }
    }
    return <main><h1>내 주문</h1>{orders.length === 0 ? <p>주문이 없어.</p> : orders.map((o) => <section key={o.id}>
        <h2>{o.preorderTitle}</h2><p>{o.orderNumber} · {orderLabels[o.status] || o.status}</p>
        <p>{Number(o.totalPaymentAmount).toLocaleString()} {o.currency}</p>
        <p>배송지: {o.receiverName} / {o.receiverPhone} / {o.postalCode || ''} {o.address1} {o.address2 || ''}</p>
        {['PENDING_PAYMENT','PAID'].includes(o.status) && <button onClick={() => editReceiver(o)}>배송지 변경</button>}
        {o.items.map((item) => <p key={item.id}>{item.productName} / {item.optionName} / {item.quantity}개</p>)}
        {o.status === 'PENDING_PAYMENT' && <><button onClick={() => pay(o)}>테스트 결제 승인</button><button onClick={async () => { await cancelOrder(o.id); await load() }}>주문 취소</button></>}
        {['PAID','PREPARING'].includes(o.status) && paymentFor(o.id)?.status === 'PAID' && <button onClick={async () => { if (confirm('이 결제를 환불할까?')) { await refundPayment(paymentFor(o.id).id); await load() } }}>환불</button>}
        {shipmentFor(o.id) && <p>배송 상태: {shipmentFor(o.id).status} {shipmentFor(o.id).courierCode || ''} {shipmentFor(o.id).trackingNumber || ''}</p>}
        <hr />
    </section>)}</main>
}
export default MyOrdersPage
