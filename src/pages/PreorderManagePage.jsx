import { useEffect, useState } from 'react'
import { getMyProducts } from '../api/productApi'
import {
    cancelPreorder,
    closePreorder,
    createPreorder,
    finalizePreorder,
    getMyPreorders,
    openPreorder,
    schedulePreorder,
} from '../api/preorderApi'

const initialForm = {
    productId: '',
    title: '',
    description: '',
    preorderPrice: '',
    currency: 'KRW',
    targetQuantity: '1',
    maxQuantity: '',
    minOrderQuantity: '1',
    maxOrderQuantityPerMember: '',
    startAt: '',
    endAt: '',
    productionExpectedAt: '',
    shippingExpectedAt: '',
}

const toNullableNumber = (value) => value === '' ? null : Number(value)
const toNullableDate = (value) => value === '' ? null : value

function PreorderManagePage() {
    const [products, setProducts] = useState([])
    const [preorders, setPreorders] = useState([])
    const [form, setForm] = useState(initialForm)

    const load = async () => {
        try {
            const [productList, preorderList] = await Promise.all([getMyProducts(), getMyPreorders()])
            setProducts(productList)
            setPreorders(preorderList)
        } catch (error) {
            console.error(error)
            alert('프리오더 정보를 불러오지 못했어.')
        }
    }

    useEffect(() => {
        load()
    }, [])

    const submit = async (e) => {
        e.preventDefault()
        try {
            await createPreorder({
                productId: Number(form.productId),
                title: form.title,
                description: form.description,
                preorderPrice: Number(form.preorderPrice),
                currency: form.currency,
                targetQuantity: Number(form.targetQuantity),
                maxQuantity: toNullableNumber(form.maxQuantity),
                minOrderQuantity: Number(form.minOrderQuantity),
                maxOrderQuantityPerMember: toNullableNumber(form.maxOrderQuantityPerMember),
                startAt: form.startAt,
                endAt: form.endAt,
                productionExpectedAt: toNullableDate(form.productionExpectedAt),
                shippingExpectedAt: toNullableDate(form.shippingExpectedAt),
            })
            setForm(initialForm)
            await load()
        } catch (error) {
            console.error(error)
            alert(error.response?.data?.message || '프리오더 생성에 실패했어.')
        }
    }

    const run = async (action) => {
        try {
            await action()
            await load()
        } catch (error) {
            console.error(error)
            alert(error.response?.data?.message || '프리오더 상태 변경에 실패했어.')
        }
    }

    return (
        <div>
            <h1>프리오더 관리</h1>
            <p>프리오더는 초안 → 예약 → 판매중 → 마감 → 성공/실패 순서로 상태가 바뀌어.</p>

            <form onSubmit={submit}>
                <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
                    <option value="">상품 선택</option>
                    {products.map((product) => (
                        <option key={product.id} value={product.id}>{product.brandName} / {product.name}</option>
                    ))}
                </select>
                <input placeholder="프리오더 제목" value={form.title}
                       onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <textarea placeholder="프리오더 설명" value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <input type="number" min="0" placeholder="프리오더 판매가" value={form.preorderPrice}
                       onChange={(e) => setForm({ ...form, preorderPrice: e.target.value })} required />
                <input placeholder="통화 (KRW)" value={form.currency}
                       onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} maxLength={3} required />
                <input type="number" min="1" placeholder="목표 수량" value={form.targetQuantity}
                       onChange={(e) => setForm({ ...form, targetQuantity: e.target.value })} required />
                <input type="number" min="1" placeholder="전체 최대 판매 수량 (선택)" value={form.maxQuantity}
                       onChange={(e) => setForm({ ...form, maxQuantity: e.target.value })} />
                <input type="number" min="1" placeholder="1회 최소 주문 수량" value={form.minOrderQuantity}
                       onChange={(e) => setForm({ ...form, minOrderQuantity: e.target.value })} required />
                <input type="number" min="1" placeholder="회원별 최대 주문 수량 (선택)" value={form.maxOrderQuantityPerMember}
                       onChange={(e) => setForm({ ...form, maxOrderQuantityPerMember: e.target.value })} />

                <div>
                    <label>판매 시작일시</label>
                    <input type="datetime-local" value={form.startAt}
                           onChange={(e) => setForm({ ...form, startAt: e.target.value })} required />
                </div>
                <div>
                    <label>판매 종료일시</label>
                    <input type="datetime-local" value={form.endAt}
                           onChange={(e) => setForm({ ...form, endAt: e.target.value })} required />
                </div>
                <div>
                    <label>생산 예정일시</label>
                    <input type="datetime-local" value={form.productionExpectedAt}
                           onChange={(e) => setForm({ ...form, productionExpectedAt: e.target.value })} />
                </div>
                <div>
                    <label>배송 예정일시</label>
                    <input type="datetime-local" value={form.shippingExpectedAt}
                           onChange={(e) => setForm({ ...form, shippingExpectedAt: e.target.value })} />
                </div>
                <button type="submit">프리오더 초안 생성</button>
            </form>

            <hr />

            {preorders.length === 0 ? <p>등록된 프리오더가 없어.</p> : preorders.map((preorder) => (
                <section key={preorder.id}>
                    <h2>{preorder.title}</h2>
                    <p>상품: {preorder.productName}</p>
                    <p>상태: <b>{preorder.status}</b></p>
                    <p>판매가: {Number(preorder.preorderPrice).toLocaleString()} {preorder.currency}</p>
                    <p>주문수량: {preorder.orderedQuantity} / 목표 {preorder.targetQuantity}
                        {preorder.maxQuantity ? ` / 최대 ${preorder.maxQuantity}` : ''}</p>
                    <p>회원별 최대 주문: {preorder.maxOrderQuantityPerMember || '제한 없음'}</p>
                    <p>판매 기간: {preorder.startAt} ~ {preorder.endAt}</p>
                    {preorder.cancellationReason && <p>취소 사유: {preorder.cancellationReason}</p>}

                    {preorder.status === 'DRAFT' && (
                        <button onClick={() => run(() => schedulePreorder(preorder.id))}>판매 예약</button>
                    )}
                    {(preorder.status === 'DRAFT' || preorder.status === 'SCHEDULED') && (
                        <button onClick={() => run(() => openPreorder(preorder.id))}>판매 시작</button>
                    )}
                    {preorder.status === 'OPEN' && (
                        <button onClick={() => run(() => closePreorder(preorder.id))}>판매 마감</button>
                    )}
                    {preorder.status === 'CLOSED' && (
                        <button onClick={() => run(() => finalizePreorder(preorder.id))}>성공/실패 확정</button>
                    )}
                    {!['SUCCESS', 'FAILED', 'CANCELLED'].includes(preorder.status) && (
                        <button onClick={() => {
                            const reason = prompt('프리오더 취소 사유를 입력해줘.')
                            if (reason) run(() => cancelPreorder(preorder.id, reason))
                        }}>취소</button>
                    )}
                    <hr />
                </section>
            ))}
        </div>
    )
}

export default PreorderManagePage
