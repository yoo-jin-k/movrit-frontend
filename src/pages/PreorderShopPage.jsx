import { useEffect, useState } from 'react'
import { getVariants } from '../api/productApi'
import { createOrder, getOpenPreorders } from '../api/commerceApi'

const emptyAddress = { receiverName: '', receiverPhone: '', postalCode: '', address1: '', address2: '' }

function PreorderShopPage() {
    const [preorders, setPreorders] = useState([])
    const [variants, setVariants] = useState({})
    const [forms, setForms] = useState({})

    useEffect(() => { getOpenPreorders().then(setPreorders).catch(() => alert('판매 중인 프리오더를 불러오지 못했어.')) }, [])

    const loadVariants = async (preorder) => {
        if (variants[preorder.id]) return
        const list = (await getVariants(preorder.productId)).filter((item) => item.active && item.availableQuantity > 0)
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
            })
            alert(`주문 ${created.orderNumber}이 생성됐어. 내 주문에서 결제를 진행해줘.`)
        } catch (error) { alert(error.response?.data?.message || '주문 생성에 실패했어.') }
    }

    return <main>
        <h1>진행 중인 프리오더</h1>
        {preorders.length === 0 ? <p>현재 판매 중인 프리오더가 없어.</p> : preorders.map((item) => <section key={item.id}>
            <h2>{item.title}</h2>
            <p>{item.productName} · {Number(item.preorderPrice).toLocaleString()}원</p>
            <p>주문 {item.orderedQuantity} / 목표 {item.targetQuantity}</p>
            <button onClick={() => loadVariants(item)}>옵션 선택 및 주문</button>
            {variants[item.id] && <div className="form-grid">
                <label>옵션<select value={forms[item.id]?.productVariantId} onChange={(e) => change(item.id, 'productVariantId', e.target.value)}>
                    {variants[item.id].map((v) => <option key={v.id} value={v.id}>{v.skuCode} · 재고 {v.availableQuantity}</option>)}
                </select></label>
                <label>수량<input type="number" min={item.minOrderQuantity} max={item.maxOrderQuantityPerMember || undefined} value={forms[item.id]?.quantity || ''} onChange={(e) => change(item.id, 'quantity', e.target.value)} /></label>
                {Object.keys(emptyAddress).map((name) => <label key={name}>{({receiverName:'받는 분',receiverPhone:'연락처',postalCode:'우편번호',address1:'주소',address2:'상세 주소'})[name]}<input value={forms[item.id]?.[name] || ''} required={['receiverName','receiverPhone','address1'].includes(name)} onChange={(e) => change(item.id, name, e.target.value)} /></label>)}
                <button onClick={() => order(item)}>주문 만들기</button>
            </div>}
            <hr />
        </section>)}
    </main>
}
export default PreorderShopPage
