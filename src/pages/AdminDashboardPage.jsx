import { useEffect, useState } from 'react'
import {
    cancelAdminSettlement, changeMemberStatus, confirmAdminSettlement,
    createAdminSettlement, getAdminDashboard, getAdminSettlements, getMembers, payAdminSettlement,
} from '../api/adminApi'

export default function AdminDashboardPage() {
    const [data, setData] = useState(null)
    const [members, setMembers] = useState([])
    const [settlements, setSettlements] = useState([])
    const [preorderId, setPreorderId] = useState('')
    const [feeRate, setFeeRate] = useState('10')

    const load = async () => {
        const [dashboard, memberList, settlementList] = await Promise.all([getAdminDashboard(), getMembers(), getAdminSettlements()])
        setData(dashboard); setMembers(memberList); setSettlements(settlementList)
    }
    useEffect(() => {
        Promise.all([getAdminDashboard(), getMembers(), getAdminSettlements()])
            .then(([dashboard, memberList, settlementList]) => { setData(dashboard); setMembers(memberList); setSettlements(settlementList) })
            .catch(() => alert('관리자 정보를 불러오지 못했어.'))
    }, [])
    const run = async (job) => { try { await job(); await load() } catch (e) { alert(e.response?.data?.message || '처리에 실패했어.') } }
    if (!data) return <p>불러오는 중...</p>

    const unsettled = data.preorders.filter((p) => p.status === 'COMPLETED' && !settlements.some((s) => s.preorderId === p.id))
    return <main>
        <h1>관리자 운영 대시보드</h1>
        <section><h2>전체 현황</h2>{Object.entries(data.summary).map(([key, value]) => <span key={key} style={{ marginRight:16 }}>{key}: <b>{typeof value === 'number' ? value.toLocaleString() : value}</b></span>)}</section>
        <h2>회원 관리</h2>
        {members.map((member) => <p key={member.id}>{member.email} / {member.name} / {member.status} {member.status === 'ACTIVE' ? <button onClick={() => run(() => changeMemberStatus(member.id, 'SUSPENDED'))}>정지</button> : member.status === 'SUSPENDED' ? <button onClick={() => run(() => changeMemberStatus(member.id, 'ACTIVE'))}>복구</button> : null}</p>)}
        <section><h2>정산 관리</h2>
            <form className="form-grid" onSubmit={(event) => { event.preventDefault(); run(() => createAdminSettlement(Number(preorderId), Number(feeRate))); setPreorderId('') }}>
                <label>구매 확정 프리오더<select required value={preorderId} onChange={(event) => setPreorderId(event.target.value)}><option value="">선택</option>{unsettled.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
                <label>플랫폼 수수료율(%)<input type="number" min="0" max="100" step="0.01" required value={feeRate} onChange={(event) => setFeeRate(event.target.value)} /></label>
                <button type="submit">결제 원장으로 정산 계산</button>
            </form>
            {settlements.map((s) => <p key={s.id}><b>{s.settlementNumber}</b> / {s.status} / 총매출 {Number(s.grossAmount).toLocaleString()} / 환불 {Number(s.refundAmount).toLocaleString()} / 수수료 {Number(s.platformFeeAmount).toLocaleString()} / 순액 {Number(s.netAmount).toLocaleString()} {s.currency} {s.status === 'PENDING' && <><button onClick={() => run(() => confirmAdminSettlement(s.id))}>확정</button><button onClick={() => run(() => cancelAdminSettlement(s.id))}>취소</button></>} {s.status === 'CONFIRMED' && <button onClick={() => run(() => payAdminSettlement(s.id))}>지급 완료</button>}</p>)}
        </section>
        {[['프리오더','preorders'], ['주문','orders'], ['결제','payments'], ['협업','collaborations']].map(([label,key]) => <section key={key}><h2>{label}</h2>{data[key].map((item) => <p key={item.type + item.id}>{item.title} / {item.status} / {item.detail}</p>)}</section>)}
    </main>
}
