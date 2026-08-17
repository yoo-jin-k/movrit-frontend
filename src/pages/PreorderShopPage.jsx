import { useEffect, useState } from 'react'
import { getVariants } from '../api/productApi'
import { browsePreorders, createOrder, getOpenPreorders } from '../api/commerceApi'
import { useParams, useSearchParams } from 'react-router-dom'
import { trackReferral } from '../api/collaborationApi'

const emptyAddress = { receiverName: '', receiverPhone: '', postalCode: '', address1: '', address2: '' }

function PreorderShopPage() {
    const { preorderId } = useParams()
    const [searchParams] = useSearchParams()
    const referralCode = searchParams.get('ref')
    const [preorders, setPreorders] = useState([])
    const [variants, setVariants] = useState({})
    const [forms, setForms] = useState({})
    const [filters, setFilters] = useState({ keyword:'', category:'', status:'OPEN' })

    useEffect(() => {
        getOpenPreorders().then((list) => setPreorders(preorderId ? list.filter((p) => String(p.id) === preorderId) : list)).catch(() => alert('판매 중인 프리오더를 불러오지 못했어.'))
        if (referralCode) {
            const key = sessionStorage.getItem('movritVisitorKey') || crypto.randomUUID()
            sessionStorage.setItem('movritVisitorKey', key)
            trackReferral(referralCode, { visitorKey:key, userAgent:navigator.userAgent }).catch(() => {})
        }
    }, [preorderId, referralCode])

    const search = async (e) => {
        e.preventDefault()
        setPreorders(await browsePreorders(Object.fromEntries(Object.entries(filters).filter(([,v]) => v))))
    }

    const loadVariants = async (preorder) => {
        if (variants[preorder.id]) return
        const allowed = new Set(preorder.variantIds || [])
        const list = (await getVariants(preorder.productId)).filter((item) => allowed.has(item.id) && item.active && item.availableQuantity > 0)
        setVariants((current) => ({ ...current, [preorder.id]: list }))
        setForms((current) => ({ ...current, [preorder.id]: { ...emptyAddress, productVariantId: list[0]?.id || '', quantity: preorder.minOrderQuantity } }))
    }

    const change = (id, name, value) => setForms((current) => ({ ...current, [id]: { ...current[id], [name]: value } }))

    const order = async (preorder) => {
        const form = forms[preorder.id]
        if (!form?.productVariantId) return alert('주문할 SKU를 선택해줘.')
        if (preorder.maxOrderQuantityPerMember && Number(form.quantity) > preorder.maxOrderQuantityPerMember) return alert('회원별 최대 주문 수량을 확인해줘.')
        try {
            const created = await createOrder({
                ...form,
                preorderId: preorder.id,
                productVariantId: Number(form.productVariantId),
                quantity: Number(form.quantity),
                requestKey: crypto.randomUUID(),
                acquisitionSource: 'WEB',
                referralCode,
            })
            alert(`주문 ${created.orderNumber}이 생성됐어. 내 주문에서 결제를 진행해줘.`)
        } catch (error) { alert(error.response?.data?.message || '주문 생성에 실패했어.') }
    }

    return <main>
        <h1>프리오더 탐색</h1>
        {!preorderId && <form className="form-grid" onSubmit={search}>
            <label>검색어<input value={filters.keyword} onChange={(e) => setFilters({...filters,keyword:e.target.value})} placeholder="상품명 또는 브랜드명" /></label>
            <label>카테고리<input value={filters.category} onChange={(e) => setFilters({...filters,category:e.target.value})} /></label>
            <label>상태<select value={filters.status} onChange={(e) => setFilters({...filters,status:e.target.value})}><option value="">전체 공개상태</option><option value="SCHEDULED">예정</option><option value="OPEN">진행 중</option><option value="SUCCESS">성공</option><option value="FAILED">실패</option><option value="PRODUCTION">생산</option><option value="SHIPPING">배송</option><option value="COMPLETED">완료</option></select></label><button>검색</button>
        </form>}
        {preorders.length === 0 ? <p>현재 판매 중인 프리오더가 없어.</p> : preorders.map((item) => <section key={item.id}>
            <h2>{item.title}</h2>
            <p>{item.productName} · {Number(item.preorderPrice).toLocaleString()}원</p>
            <p>{item.brandName} · {item.category || '카테고리 없음'}</p><p>주문 {item.orderedQuantity} / 목표 {item.targetQuantity} · 달성률 {item.achievementRate.toFixed(1)}%</p>
            {item.status === 'OPEN' && <button onClick={() => loadVariants(item)}>옵션 선택 및 주문</button>}
            {variants[item.id] && <div className="form-grid">
                {variants[item.id].length === 0 ? <p>현재 주문 가능한 옵션이 없어.</p> : <>
                    <label>옵션<select value={forms[item.id]?.productVariantId} onChange={(e) => change(item.id, 'productVariantId', e.target.value)}>
                        {variants[item.id].map((v) => <option key={v.id} value={v.id}>{v.skuCode} · 재고 {v.availableQuantity}</option>)}
                    </select></label>
                    <label>수량<input type="number" min={item.minOrderQuantity} max={item.maxOrderQuantityPerMember || undefined} value={forms[item.id]?.quantity || ''} onChange={(e) => change(item.id, 'quantity', e.target.value)} /></label>
                    {Object.keys(emptyAddress).map((name) => <label key={name}>{({receiverName:'받는 분',receiverPhone:'연락처',postalCode:'우편번호',address1:'주소',address2:'상세 주소'})[name]}<input value={forms[item.id]?.[name] || ''} required={['receiverName','receiverPhone','address1'].includes(name)} onChange={(e) => change(item.id, name, e.target.value)} /></label>)}
                    <button onClick={() => order(item)}>주문 만들기</button>
                </>}
            </div>}
            <hr />
        </section>)}
    </main>
}
export default PreorderShopPage
