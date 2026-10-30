/**
 * 상품별 활성 SKU를 골라 프리오더 초안을 만들고 서버 상태별 명령을 제공합니다.
 * 상품을 바꾸면 옵션 선택을 초기화하며 숫자·날짜 입력을 요청 형식으로 바꾼 뒤 서버 결과로 목록을 갱신합니다.
 */
import { useEffect, useMemo, useState } from 'react'
import { getMyProducts, getVariants } from '../api/productApi'
import {
  cancelPreorder,
  closePreorder,
  createPreorder,
  deletePreorder,
  finalizePreorder,
  getMyPreorders,
  openPreorder,
  schedulePreorder,
  startProduction,
  startShipping,
  completePreorder,
} from '../api/preorderApi'

const initialForm = {
  productId: '',
  variantIds: [],
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

const statusLabel = {
  DRAFT: '초안',
  SCHEDULED: '판매 예정',
  OPEN: '판매중',
  CLOSED: '판매 마감',
  SUCCESS: '공구 성공',
  FAILED: '공구 실패',
  PRODUCTION: '생산 중',
  SHIPPING: '배송 중',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

const toNullableNumber = (value) => (value === '' ? null : Number(value))
const toNullableDate = (value) => (value === '' ? null : value)
const formatDate = (value) =>
  value ? new Date(value).toLocaleString('ko-KR') : '-'

function PreorderManagePage() {
  const [products, setProducts] = useState([])
  const [productVariants, setProductVariants] = useState([])
  const [preorders, setPreorders] = useState([])
  const [form, setForm] = useState(initialForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 상품 조회와 프리오더 조회의 실패 처리를 분리합니다. 상품 선택이 없다면 조회된 첫 상품으로 초기화합니다.
  const load = async () => {
    setLoading(true)
    try {
      const productList = await getMyProducts()
      setProducts(productList)
      setForm((current) =>
        current.productId || productList.length === 0
          ? current
          : { ...current, productId: String(productList[0].id) },
      )
    } catch (error) {
      console.error('상품 조회 실패', error)
      setProducts([])
    }

    try {
      setPreorders(await getMyPreorders())
    } catch (error) {
      console.error('프리오더 조회 실패', error)
      alert('프리오더 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  useEffect(() => {
    if (!form.productId) {
      // 상품 선택을 지우면 이전 상품의 SKU가 남지 않게 즉시 초기화합니다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProductVariants([])
      return
    }
    getVariants(Number(form.productId))
      .then((items) => setProductVariants(items.filter((item) => item.active)))
      .catch(() => setProductVariants([]))
  }, [form.productId])

  const selectedProduct = useMemo(
    () =>
      products.find((product) => String(product.id) === String(form.productId)),
    [products, form.productId],
  )

  const change = (name, value) =>
    setForm((current) => ({ ...current, [name]: value }))
  // 다른 상품을 선택하면 이전 상품의 SKU 선택을 함께 초기화하여 잘못된 옵션 연결을 방지합니다.
  const changeProduct = (value) =>
    setForm((current) => ({ ...current, productId: value, variantIds: [] }))
  const toggleVariant = (id) =>
    setForm((current) => ({
      ...current,
      variantIds: current.variantIds.includes(id)
        ? current.variantIds.filter((variantId) => variantId !== id)
        : [...current.variantIds, id],
    }))

  // 선택 SKU·모집 기간·수량 조건을 확인하고 선택 입력의 빈 값은 null로 변환합니다.
  // 생성 성공 후 반환된 프리오더를 목록에 반영하며 상품을 새로 생성하지 않습니다.
  const submit = async (e) => {
    e.preventDefault()
    if (form.variantIds.length === 0)
      return alert('판매할 SKU를 하나 이상 선택해 주세요.')
    if (new Date(form.startAt) >= new Date(form.endAt))
      return alert('판매 종료일시는 시작일시보다 뒤여야 합니다.')
    if (
      form.maxQuantity &&
      Number(form.maxQuantity) < Number(form.targetQuantity)
    )
      return alert('최대 판매 수량은 목표 수량보다 작을 수 없습니다.')

    setSubmitting(true)
    try {
      const created = await createPreorder({
        productId: Number(form.productId),
        variantIds: form.variantIds,
        title: form.title.trim(),
        description: form.description,
        preorderPrice: Number(form.preorderPrice),
        currency: form.currency,
        targetQuantity: Number(form.targetQuantity),
        maxQuantity: toNullableNumber(form.maxQuantity),
        minOrderQuantity: Number(form.minOrderQuantity),
        maxOrderQuantityPerMember: toNullableNumber(
          form.maxOrderQuantityPerMember,
        ),
        startAt: form.startAt,
        endAt: form.endAt,
        productionExpectedAt: toNullableDate(form.productionExpectedAt),
        shippingExpectedAt: toNullableDate(form.shippingExpectedAt),
      })
      setPreorders((current) => [created, ...current])
      setForm({
        ...initialForm,
        productId: products.length ? String(products[0].id) : '',
      })
      setShowForm(false)
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || '프리오더 생성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // 서버가 반환한 변경 항목으로 목록을 갱신합니다. 화면에서 다음 상태를 계산해 먼저 적용하지 않습니다.
  const changeStatus = async (id, action) => {
    try {
      const changed = await action()
      setPreorders((current) =>
        current.map((item) => (item.id === id ? changed : item)),
      )
    } catch (error) {
      console.error(error)
      alert(
        error.response?.data?.message || '프리오더 상태 변경에 실패했습니다.',
      )
    }
  }

  // 삭제 확인을 받은 뒤 서버 삭제가 성공한 경우에만 현재 목록에서 제외합니다.
  const remove = async (id) => {
    if (!window.confirm('이 프리오더 초안을 삭제할까?')) return
    try {
      await deletePreorder(id)
      setPreorders((current) => current.filter((item) => item.id !== id))
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || '프리오더 삭제에 실패했습니다.')
    }
  }

  return (
    <main>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div>
          <h1>프리오더 · 공동구매 관리</h1>
          <p>상품의 판매 기간과 목표 수량, 실제 판매할 SKU를 설정해.</p>
        </div>
        <button
          onClick={() => setShowForm((value) => !value)}
          disabled={products.length === 0}
        >
          {showForm ? '등록 취소' : '+ 프리오더 등록'}
        </button>
      </div>

      {products.length === 0 && !loading && (
        <p>
          등록된 상품이 없습니다. 먼저 상품 · 재고 관리에서 판매할 상품을 등록해
          주세요.
        </p>
      )}

      {showForm && (
        <form
          onSubmit={submit}
          style={{ display: 'grid', gap: 10, margin: '24px 0' }}
        >
          <h2>프리오더 기본 정보</h2>
          <label>
            판매 상품
            <select
              value={form.productId}
              onChange={(e) => changeProduct(e.target.value)}
              required
            >
              <option value="">상품 선택</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.brandName} / {product.name}
                </option>
              ))}
            </select>
          </label>
          {selectedProduct && (
            <small>
              선택 상품 정상가:{' '}
              {Number(
                selectedProduct.regularPrice ||
                  selectedProduct.normalPrice ||
                  0,
              ).toLocaleString()}
              원
            </small>
          )}

          <fieldset>
            <legend>판매할 SKU</legend>
            {productVariants.length === 0 ? (
              <p>
                활성화된 SKU가 없어. 상품 · 재고 관리에서 SKU를 먼저 만들어줘.
              </p>
            ) : (
              productVariants.map((variant) => (
                <label key={variant.id} style={{ display: 'block' }}>
                  <input
                    type="checkbox"
                    checked={form.variantIds.includes(variant.id)}
                    onChange={() => toggleVariant(variant.id)}
                  />
                  {variant.skuCode} · {variant.optionValue1 || '기본'}
                  {variant.optionValue2 ? ` / ${variant.optionValue2}` : ''} ·
                  판매가능 {variant.availableQuantity}개
                </label>
              ))
            )}
          </fieldset>

          <label>
            공동구매 제목
            <input
              value={form.title}
              onChange={(e) => change('title', e.target.value)}
              required
            />
          </label>
          <label>
            공동구매 설명
            <textarea
              value={form.description}
              onChange={(e) => change('description', e.target.value)}
            />
          </label>
          <label>
            공동구매 판매가
            <input
              type="number"
              min="0"
              value={form.preorderPrice}
              onChange={(e) => change('preorderPrice', e.target.value)}
              required
            />
          </label>
          <h2>수량 정책</h2>
          <label>
            목표 수량
            <input
              type="number"
              min="1"
              value={form.targetQuantity}
              onChange={(e) => change('targetQuantity', e.target.value)}
              required
            />
          </label>
          <label>
            최대 판매 수량 (선택)
            <input
              type="number"
              min="1"
              value={form.maxQuantity}
              onChange={(e) => change('maxQuantity', e.target.value)}
            />
          </label>
          <label>
            1회 최소 주문 수량
            <input
              type="number"
              min="1"
              value={form.minOrderQuantity}
              onChange={(e) => change('minOrderQuantity', e.target.value)}
              required
            />
          </label>
          <label>
            회원별 최대 주문 수량 (선택)
            <input
              type="number"
              min="1"
              value={form.maxOrderQuantityPerMember}
              onChange={(e) =>
                change('maxOrderQuantityPerMember', e.target.value)
              }
            />
          </label>
          <h2>일정</h2>
          <label>
            판매 시작일시
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => change('startAt', e.target.value)}
              required
            />
          </label>
          <label>
            판매 종료일시
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => change('endAt', e.target.value)}
              required
            />
          </label>
          <label>
            생산 예정일시 (선택)
            <input
              type="datetime-local"
              value={form.productionExpectedAt}
              onChange={(e) => change('productionExpectedAt', e.target.value)}
            />
          </label>
          <label>
            배송 예정일시 (선택)
            <input
              type="datetime-local"
              value={form.shippingExpectedAt}
              onChange={(e) => change('shippingExpectedAt', e.target.value)}
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? '등록 중...' : '프리오더 초안 등록'}
          </button>
        </form>
      )}

      <hr />
      <h2>등록된 프리오더</h2>
      {loading ? (
        <p>불러오는 중...</p>
      ) : preorders.length === 0 ? (
        <p>등록된 프리오더가 없습니다.</p>
      ) : (
        preorders.map((preorder) => (
          <section key={preorder.id} style={{ marginBottom: 24 }}>
            <h3>{preorder.title}</h3>
            <p>상품: {preorder.productName}</p>
            <p>
              상태: <b>{statusLabel[preorder.status] || preorder.status}</b>
            </p>
            <p>판매 SKU: {preorder.variantIds?.length || 0}개</p>
            <p>
              판매가: {Number(preorder.preorderPrice).toLocaleString()}{' '}
              {preorder.currency}
            </p>
            <p>
              주문수량: {preorder.orderedQuantity} / 목표{' '}
              {preorder.targetQuantity}
              {preorder.maxQuantity ? ` / 최대 ${preorder.maxQuantity}` : ''}
            </p>
            <p>
              주문 제한: 최소 {preorder.minOrderQuantity}개 / 회원별 최대{' '}
              {preorder.maxOrderQuantityPerMember || '제한 없음'}
            </p>
            <p>
              판매 기간: {formatDate(preorder.startAt)} ~{' '}
              {formatDate(preorder.endAt)}
            </p>
            <p>
              생산 예정: {formatDate(preorder.productionExpectedAt)} / 배송
              예정: {formatDate(preorder.shippingExpectedAt)}
            </p>
            {preorder.description && <p>{preorder.description}</p>}
            {preorder.cancellationReason && (
              <p>취소 사유: {preorder.cancellationReason}</p>
            )}
            {preorder.status === 'DRAFT' && (
              <button
                onClick={() =>
                  changeStatus(preorder.id, () => schedulePreorder(preorder.id))
                }
              >
                판매 예약
              </button>
            )}
            {(preorder.status === 'DRAFT' ||
              preorder.status === 'SCHEDULED') && (
              <button
                onClick={() =>
                  changeStatus(preorder.id, () => openPreorder(preorder.id))
                }
              >
                판매 시작
              </button>
            )}
            {preorder.status === 'OPEN' && (
              <button
                onClick={() =>
                  changeStatus(preorder.id, () => closePreorder(preorder.id))
                }
              >
                판매 마감
              </button>
            )}
            {preorder.status === 'CLOSED' && (
              <button
                onClick={() =>
                  changeStatus(preorder.id, () => finalizePreorder(preorder.id))
                }
              >
                성공/실패 확정
              </button>
            )}
            {preorder.status === 'SUCCESS' && (
              <button
                onClick={() =>
                  changeStatus(preorder.id, () => startProduction(preorder.id))
                }
              >
                생산 시작
              </button>
            )}
            {preorder.status === 'PRODUCTION' && (
              <button
                onClick={() =>
                  changeStatus(preorder.id, () => startShipping(preorder.id))
                }
              >
                배송 단계 시작
              </button>
            )}
            {preorder.status === 'SHIPPING' && (
              <button
                onClick={() =>
                  changeStatus(preorder.id, () => completePreorder(preorder.id))
                }
              >
                프로젝트 완료
              </button>
            )}
            {!['SUCCESS', 'FAILED', 'CANCELLED'].includes(preorder.status) && (
              <button
                onClick={() => {
                  const reason = prompt('프리오더 취소 사유를 입력해 주세요.')
                  if (reason?.trim())
                    changeStatus(preorder.id, () =>
                      cancelPreorder(preorder.id, reason.trim()),
                    )
                }}
              >
                취소
              </button>
            )}
            {preorder.status === 'DRAFT' && (
              <button onClick={() => remove(preorder.id)}>초안 삭제</button>
            )}
            <hr />
          </section>
        ))
      )}
    </main>
  )
}

export default PreorderManagePage
