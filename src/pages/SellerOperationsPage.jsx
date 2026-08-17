import { useEffect, useState } from 'react'
import {
    createShipment, deliverShipment, getSellerOrders, getSettlements, getShipments,
    prepareShipment, shipShipment, confirmSettlement, paySettlement, cancelSettlement, createSettlement,
} from '../api/commerceApi'
import { getMyPreorders } from '../api/preorderApi'

const labels = { PAID:'결제 완료', PREPARING:'배송 준비', SHIPPED:'배송 중', DELIVERED:'배송 완료', READY:'배송 등록', PENDING:'정산 대기', CONFIRMED:'정산 확정' }

function SellerOperationsPage() {
    const [orders, setOrders] = useState([])
    const [shipments, setShipments] = useState([])
    const [settlements, setSettlements] = useState([])
    const [preorders, setPreorders] = useState([])
    const [settlementForm, setSettlementForm] = useState({ preorderId:'', grossAmount:'', refundAmount:'0', platformFeeAmount:'0' })
    const load = async () => { const [o,s,t,p] = await Promise.all([getSellerOrders(),getShipments(),getSettlements(),getMyPreorders()]); setOrders(o);setShipments(s);setSettlements(t);setPreorders(p) }
    useEffect(() => {
        Promise.all([getSellerOrders(), getShipments(), getSettlements(), getMyPreorders()])
            .then(([o, s, t, p]) => { setOrders(o); setShipments(s); setSettlements(t); setPreorders(p) })
            .catch(() => alert('운영 정보를 불러오지 못했어.'))
    }, [])
    const shipmentFor = (orderId) => shipments.find((s) => s.orderId === orderId)
    const action = async (job) => { try { await job(); await load() } catch (e) { alert(e.response?.data?.message || '처리에 실패했어.') } }
    const ship = (shipment) => {
        const courierCode = prompt('택배사 코드를 입력해줘.', shipment.courierCode || 'CJ')
        const trackingNumber = courierCode && prompt('운송장 번호를 입력해줘.')
        if (trackingNumber) action(() => shipShipment(shipment.id, { courierCode, trackingNumber }))
    }
    const submitSettlement = async (e) => {
        e.preventDefault()
        const gross = Number(settlementForm.grossAmount)
        const refund = Number(settlementForm.refundAmount)
        const fee = Number(settlementForm.platformFeeAmount)
        await action(() => createSettlement({
            preorderId: Number(settlementForm.preorderId),
            settlementNumber: `ST-${Date.now()}`,
            status: 'PENDING', grossAmount: gross, refundAmount: refund,
            platformFeeAmount: fee, netAmount: gross - refund - fee, currency: 'KRW',
        }))
        setSettlementForm({ preorderId:'', grossAmount:'', refundAmount:'0', platformFeeAmount:'0' })
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
        <form className="form-grid" onSubmit={submitSettlement}>
            <label>성공 프리오더<select required value={settlementForm.preorderId} onChange={(e) => setSettlementForm({...settlementForm, preorderId:e.target.value})}><option value="">선택</option>{preorders.filter((p) => p.status === 'SUCCESS' && !settlements.some((s) => s.preorderId === p.id)).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
            {['grossAmount','refundAmount','platformFeeAmount'].map((name) => <label key={name}>{({grossAmount:'총 결제액',refundAmount:'환불액',platformFeeAmount:'플랫폼 수수료'})[name]}<input type="number" min="0" required value={settlementForm[name]} onChange={(e) => setSettlementForm({...settlementForm,[name]:e.target.value})} /></label>)}
            <button type="submit">정산 생성</button>
        </form>
        {settlements.length === 0 ? <p>생성된 정산이 없어.</p> : settlements.map((s) => <section key={s.id}>
            <b>{s.settlementNumber}</b> · {labels[s.status] || s.status}<p>순정산액 {Number(s.netAmount).toLocaleString()} {s.currency}</p>
            {s.status === 'PENDING' && <><button onClick={() => action(() => confirmSettlement(s.id))}>정산 확정</button><button onClick={() => action(() => cancelSettlement(s.id))}>취소</button></>}
            {s.status === 'CONFIRMED' && <button onClick={() => action(() => paySettlement(s.id))}>지급 완료</button>}<hr />
        </section>)}
    </main>
}
export default SellerOperationsPage
