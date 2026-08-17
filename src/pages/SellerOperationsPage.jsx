import { useEffect, useState } from 'react'
import {
    createShipment, deliverShipment, getSellerOrders, getSettlements, getShipments,
    prepareShipment, shipShipment, confirmSettlement, paySettlement, cancelSettlement,
} from '../api/commerceApi'

const labels = { PAID:'결제 완료', PREPARING:'배송 준비', SHIPPED:'배송 중', DELIVERED:'배송 완료', READY:'배송 등록', PENDING:'정산 대기', CONFIRMED:'정산 확정' }

function SellerOperationsPage() {
    const [orders, setOrders] = useState([])
    const [shipments, setShipments] = useState([])
    const [settlements, setSettlements] = useState([])
    const load = async () => { const [o,s,t] = await Promise.all([getSellerOrders(),getShipments(),getSettlements()]); setOrders(o);setShipments(s);setSettlements(t) }
    useEffect(() => {
        Promise.all([getSellerOrders(), getShipments(), getSettlements()])
            .then(([o, s, t]) => { setOrders(o); setShipments(s); setSettlements(t) })
            .catch(() => alert('운영 정보를 불러오지 못했어.'))
    }, [])
    const shipmentFor = (orderId) => shipments.find((s) => s.orderId === orderId)
    const action = async (job) => { try { await job(); await load() } catch (e) { alert(e.response?.data?.message || '처리에 실패했어.') } }
    const ship = (shipment) => {
        const courierCode = prompt('택배사 코드를 입력해줘.', shipment.courierCode || 'CJ')
        const trackingNumber = courierCode && prompt('운송장 번호를 입력해줘.')
        if (trackingNumber) action(() => shipShipment(shipment.id, { courierCode, trackingNumber }))
    }
    return <main>
        <h1>주문 · 배송 · 정산 운영</h1>
        <h2>판매 주문</h2>
        {orders.length === 0 ? <p>판매 주문이 없어.</p> : orders.map((o) => {
            const s = shipmentFor(o.id)
            return <section key={o.id}><b>{o.orderNumber}</b> · {labels[o.status] || o.status}<p>{o.receiverName} / {o.address1} {o.address2}</p>
                {o.status === 'PAID' && !s && <button onClick={() => action(() => createShipment(o.id))}>배송 등록</button>}
                {s?.status === 'READY' && <button onClick={() => action(() => prepareShipment(s.id))}>상품 준비 시작</button>}
                {s?.status === 'PREPARING' && <button onClick={() => ship(s)}>발송 처리</button>}
                {s?.status === 'SHIPPED' && <button onClick={() => action(() => deliverShipment(s.id))}>배송 완료</button>}
                {s && <small> 배송 상태: {labels[s.status] || s.status} {s.trackingNumber || ''}</small>}<hr />
            </section>
        })}
        <h2>정산</h2>
        {settlements.length === 0 ? <p>생성된 정산이 없어. 성공 확정 프리오더에서 정산 생성 API를 호출해 등록할 수 있어.</p> : settlements.map((s) => <section key={s.id}>
            <b>{s.settlementNumber}</b> · {labels[s.status] || s.status}<p>순정산액 {Number(s.netAmount).toLocaleString()} {s.currency}</p>
            {s.status === 'PENDING' && <><button onClick={() => action(() => confirmSettlement(s.id))}>정산 확정</button><button onClick={() => action(() => cancelSettlement(s.id))}>취소</button></>}
            {s.status === 'CONFIRMED' && <button onClick={() => action(() => paySettlement(s.id))}>지급 완료</button>}<hr />
        </section>)}
    </main>
}
export default SellerOperationsPage
