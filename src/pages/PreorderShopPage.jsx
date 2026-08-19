import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getVariants } from '../api/productApi'
import { browsePreorders, createOrder, getOpenPreorders } from '../api/commerceApi'
import { trackReferral } from '../api/collaborationApi'
import { addFavoritePreorder, getFavoritePreorders, removeFavoritePreorder } from '../api/favoriteApi'
import AppHeader from '../components/layout/AppHeader'
import PreorderCard from '../components/preorder/PreorderCard'
import Button from '../components/ui/Button'
import ProgressBar from '../components/ui/ProgressBar'
import StatusBadge from '../components/ui/StatusBadge'

const emptyAddress = { receiverName: '', receiverPhone: '', postalCode: '', address1: '', address2: '' }

function PreorderShopPage() {
  const { preorderId } = useParams()
  const [searchParams] = useSearchParams()
  const referralCode = searchParams.get('ref')
  const [preorders, setPreorders] = useState([])
  const [variants, setVariants] = useState({})
  const [forms, setForms] = useState({})
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [filters, setFilters] = useState({ keyword: '', category: '', status: 'OPEN' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getOpenPreorders(), getFavoritePreorders()])
      .then(([list, favorites]) => {
        setPreorders(list)
        setFavoriteIds(new Set(favorites.map((item) => item.preorderId)))
      })
      .catch(() => alert('판매 중인 프리오더를 불러오지 못했어.'))
      .finally(() => setLoading(false))

    if (referralCode) {
      const key = sessionStorage.getItem('movritVisitorKey') || crypto.randomUUID()
      sessionStorage.setItem('movritVisitorKey', key)
      trackReferral(referralCode, { visitorKey: key, userAgent: navigator.userAgent }).catch(() => {})
    }
  }, [referralCode])

  const selected = useMemo(
    () => preorders.find((item) => String(item.id) === String(preorderId)),
    [preorders, preorderId],
  )

  const search = async (event) => {
    event.preventDefault()
    setPreorders(await browsePreorders(Object.fromEntries(Object.entries(filters).filter(([, value]) => value))))
  }

  const toggleFavorite = async (id) => {
    try {
      if (favoriteIds.has(id)) {
        await removeFavoritePreorder(id)
        setFavoriteIds((current) => {
          const next = new Set(current)
          next.delete(id)
          return next
        })
      } else {
        await addFavoritePreorder(id)
        setFavoriteIds((current) => new Set([...current, id]))
      }
    } catch (error) {
      alert(error.response?.data?.message || '관심 상태를 변경하지 못했어.')
    }
  }

  useEffect(() => {
    if (selected?.status !== 'OPEN' || variants[selected.id]) return

    const allowed = new Set(selected.variantIds || [])
    getVariants(selected.productId)
      .then((items) => items.filter((item) => allowed.has(item.id) && item.active && item.availableQuantity > 0))
      .then((items) => {
        setVariants((current) => ({ ...current, [selected.id]: items }))
        setForms((current) => ({
          ...current,
          [selected.id]: {
            ...emptyAddress,
            productVariantId: items[0]?.id || '',
            quantity: selected.minOrderQuantity || 1,
          },
        }))
      })
      .catch(() => {})
  }, [selected, variants])

  const change = (id, name, value) => setForms((current) => ({
    ...current,
    [id]: { ...current[id], [name]: value },
  }))

  const order = async (preorder) => {
    const form = forms[preorder.id]
    if (!form?.productVariantId) return alert('주문할 옵션을 선택해줘.')
    if (!form.receiverName || !form.receiverPhone || !form.address1) return alert('배송 정보를 입력해줘.')
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
    } catch (error) {
      alert(error.response?.data?.message || '주문 생성에 실패했어.')
    }
  }

  if (loading) {
    return <div className="page-shell"><AppHeader /><main className="movrit-container page-section"><p className="muted">프리오더를 불러오는 중...</p></main></div>
  }

  if (preorderId) {
    if (!selected) return <div className="page-shell"><AppHeader /><main className="movrit-container page-section"><p>프리오더를 찾을 수 없어.</p><Link to="/preorders"><Button>목록으로</Button></Link></main></div>
    const achievement = Number(selected.achievementRate || 0)
    const selectedVariants = variants[selected.id] || []
    const form = forms[selected.id] || {}

    return (
      <div className="page-shell">
        <AppHeader />
        <main className="preorder-detail">
          <div className="preorder-detail__toolbar">
            <Link to="/preorders" className="muted">← 프리오더</Link>
            <Button variant="ghost" onClick={() => toggleFavorite(selected.id)}>{favoriteIds.has(selected.id) ? '♥ 관심 해제' : '♡ 관심 등록'}</Button>
          </div>

          <div className="preorder-detail__grid">
            <div className="preorder-detail__image">{selected.thumbnailUrl ? <img src={selected.thumbnailUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'inherit' }} /> : 'PRODUCT IMAGE'}</div>
            <section className="preorder-detail__info">
              <div><StatusBadge>{selected.status === 'OPEN' ? '진행중' : selected.status}</StatusBadge></div>
              <div>
                <h1 className="preorder-detail__title">{selected.title}</h1>
                <p className="preorder-detail__brand">{selected.brandName || 'MOVRIT'} · {selected.productName}</p>
              </div>

              <div className="price-line">
                <span className="price-line__price">{Number(selected.preorderPrice || 0).toLocaleString()}원</span>
              </div>

              <div className="info-card">
                <strong>현재 {selected.orderedQuantity || 0}명 참여</strong>
                <div style={{ margin: '16px 0 8px' }}><ProgressBar value={achievement} /></div>
                <div className="info-row"><span>{achievement.toFixed(0)}% 달성</span><span>목표 {selected.targetQuantity || 0}명</span></div>
                <div className="info-row"><span>모집 종료</span><span>{selected.endAt ? new Date(selected.endAt).toLocaleString() : '-'}</span></div>
                {selected.shippingExpectedAt && <div className="info-row"><span>예상 배송</span><span>{new Date(selected.shippingExpectedAt).toLocaleDateString()}</span></div>}
              </div>

              {selected.status === 'OPEN' && <div className="info-card">
                <h2 className="section-title">옵션 선택</h2>
                <div className="option-list">
                  {selectedVariants.length === 0 ? <p className="muted">현재 주문 가능한 옵션이 없어.</p> : selectedVariants.map((variant) => (
                    <label className="option-item" key={variant.id}>
                      <span>{variant.skuCode}</span>
                      <span>재고 {variant.availableQuantity}</span>
                      <input type="radio" name={`variant-${selected.id}`} value={variant.id} checked={String(form.productVariantId) === String(variant.id)} onChange={(e) => change(selected.id, 'productVariantId', e.target.value)} />
                    </label>
                  ))}
                </div>
                <div className="info-row"><span>수량</span><input type="number" min={selected.minOrderQuantity || 1} max={selected.maxOrderQuantityPerMember || undefined} value={form.quantity || ''} onChange={(e) => change(selected.id, 'quantity', e.target.value)} /></div>
              </div>}

              {selected.status === 'OPEN' && <div className="info-card">
                <h2 className="section-title">배송 정보</h2>
                <div className="option-list">
                  {Object.keys(emptyAddress).map((name) => <input key={name} placeholder={({ receiverName:'받는 분', receiverPhone:'연락처', postalCode:'우편번호', address1:'주소', address2:'상세 주소' })[name]} value={form[name] || ''} onChange={(e) => change(selected.id, name, e.target.value)} />)}
                </div>
              </div>}

              <div className="detail-actions">
                {selected.status === 'OPEN' ? <Button block onClick={() => order(selected)}>{Number(selected.preorderPrice || 0).toLocaleString()}원 구매하기</Button> : <Button block disabled>현재 구매할 수 없어</Button>}
                <Button variant="secondary" onClick={() => toggleFavorite(selected.id)}>{favoriteIds.has(selected.id) ? '♥' : '♡'}</Button>
              </div>
            </section>
          </div>

          <section className="description-card">
            <h2 className="section-title">상품 소개</h2>
            <p className="muted">{selected.description || '상품 상세 설명이 준비 중이야.'}</p>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <AppHeader />
      <main className="movrit-container page-section">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>프리오더</h1>
          <p className="muted">사기 전에, 같이 가능성을 만들어요.</p>
        </div>
        <form className="search-panel" onSubmit={search}>
          <input aria-label="검색어" value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} placeholder="상품명 또는 브랜드명" />
          <input aria-label="카테고리" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} placeholder="카테고리" />
          <select aria-label="상태" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">전체</option><option value="SCHEDULED">예정</option><option value="OPEN">진행 중</option><option value="SUCCESS">성공</option><option value="COMPLETED">완료</option>
          </select>
          <Button type="submit">검색</Button>
        </form>
        {preorders.length === 0 ? <div className="info-card"><p className="muted">현재 공개된 프리오더가 없어.</p></div> : <div className="preorder-grid">{preorders.map((item) => <PreorderCard key={item.id} item={item} favorite={favoriteIds.has(item.id)} onToggleFavorite={toggleFavorite} />)}</div>}
      </main>
    </div>
  )
}

export default PreorderShopPage
