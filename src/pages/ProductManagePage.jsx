import { useEffect, useState } from 'react'
import { getMyBrands } from '../api/brandApi'
import {
    createProduct,
    createVariant,
    getMyProducts,
    getVariants,
    restockVariant,
    updateSafetyStock,
    uploadProductThumbnail,
} from '../api/productApi'

const emptyProduct = {
    brandId: '',
    name: '',
    description: '',
    category: '',
    normalPrice: '',
    status: 'ACTIVE',
}

const emptyVariant = {
    skuCode: '',
    optionName1: '',
    optionValue1: '',
    optionName2: '',
    optionValue2: '',
    additionalPrice: '0',
    initialStock: '0',
    safetyStock: '0',
}

const imageUrl = (path) => path ? `http://localhost:8080${path}` : null

function ProductManagePage() {
    const [brands, setBrands] = useState([])
    const [products, setProducts] = useState([])
    const [productForm, setProductForm] = useState(emptyProduct)
    const [variantForms, setVariantForms] = useState({})
    const [variants, setVariants] = useState({})

    const load = async () => {
        try {
            const [brandList, productList] = await Promise.all([getMyBrands(), getMyProducts()])
            setBrands(brandList)
            setProducts(productList)

            const pairs = await Promise.all(productList.map(async (product) => [product.id, await getVariants(product.id)]))
            setVariants(Object.fromEntries(pairs))
        } catch (error) {
            console.error(error)
            alert('상품 정보를 불러오지 못했어.')
        }
    }

    useEffect(() => {
        load()
    }, [])

    const submitProduct = async (e) => {
        e.preventDefault()
        try {
            await createProduct({
                ...productForm,
                brandId: Number(productForm.brandId),
                normalPrice: Number(productForm.normalPrice),
            })
            setProductForm(emptyProduct)
            await load()
        } catch (error) {
            console.error(error)
            alert('상품 등록에 실패했어.')
        }
    }

    const submitVariant = async (productId) => {
        const form = variantForms[productId] || emptyVariant
        try {
            await createVariant(productId, {
                ...form,
                additionalPrice: Number(form.additionalPrice),
                initialStock: Number(form.initialStock),
                safetyStock: Number(form.safetyStock),
            })
            setVariantForms({ ...variantForms, [productId]: emptyVariant })
            await load()
        } catch (error) {
            console.error(error)
            alert('옵션/SKU 등록에 실패했어.')
        }
    }

    const setVariantField = (productId, field, value) => {
        const current = variantForms[productId] || emptyVariant
        setVariantForms({ ...variantForms, [productId]: { ...current, [field]: value } })
    }

    return (
        <div>
            <h1>상품 · 재고 관리</h1>
            <p>재고는 상품 전체가 아니라 실제 판매 단위인 SKU/옵션 조합별로 관리해.</p>

            <h2>상품 등록</h2>
            <form onSubmit={submitProduct}>
                <select value={productForm.brandId}
                        onChange={(e) => setProductForm({ ...productForm, brandId: e.target.value })} required>
                    <option value="">브랜드 선택</option>
                    {brands.filter((brand) => brand.status === 'ACTIVE').map((brand) => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                </select>
                <input placeholder="상품명" value={productForm.name}
                       onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                <input placeholder="카테고리" value={productForm.category}
                       onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
                <input type="number" min="0" placeholder="정상가" value={productForm.normalPrice}
                       onChange={(e) => setProductForm({ ...productForm, normalPrice: e.target.value })} required />
                <textarea placeholder="상품 설명" value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
                <button type="submit">상품 등록</button>
            </form>

            <hr />

            {products.map((product) => {
                const variantForm = variantForms[product.id] || emptyVariant
                const productVariants = variants[product.id] || []

                return (
                    <section key={product.id}>
                        <h2>{product.name}</h2>
                        <p>브랜드: {product.brandName}</p>
                        <p>정상가: {Number(product.normalPrice).toLocaleString()}원</p>
                        {product.thumbnailUrl && <img src={imageUrl(product.thumbnailUrl)} alt={product.name} width="180" />}
                        <div>
                            <label>상품 대표 이미지</label>
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                await uploadProductThumbnail(product.id, file)
                                await load()
                            }} />
                        </div>

                        <h3>옵션/SKU 추가</h3>
                        <input placeholder="SKU 코드 (예: TSHIRT-BLK-M)" value={variantForm.skuCode}
                               onChange={(e) => setVariantField(product.id, 'skuCode', e.target.value)} />
                        <input placeholder="옵션1 이름 (예: 색상)" value={variantForm.optionName1}
                               onChange={(e) => setVariantField(product.id, 'optionName1', e.target.value)} />
                        <input placeholder="옵션1 값 (예: 블랙)" value={variantForm.optionValue1}
                               onChange={(e) => setVariantField(product.id, 'optionValue1', e.target.value)} />
                        <input placeholder="옵션2 이름 (예: 사이즈)" value={variantForm.optionName2}
                               onChange={(e) => setVariantField(product.id, 'optionName2', e.target.value)} />
                        <input placeholder="옵션2 값 (예: M)" value={variantForm.optionValue2}
                               onChange={(e) => setVariantField(product.id, 'optionValue2', e.target.value)} />
                        <input type="number" min="0" placeholder="추가금액" value={variantForm.additionalPrice}
                               onChange={(e) => setVariantField(product.id, 'additionalPrice', e.target.value)} />
                        <input type="number" min="0" placeholder="초기 실재고" value={variantForm.initialStock}
                               onChange={(e) => setVariantField(product.id, 'initialStock', e.target.value)} />
                        <input type="number" min="0" placeholder="안전재고" value={variantForm.safetyStock}
                               onChange={(e) => setVariantField(product.id, 'safetyStock', e.target.value)} />
                        <button type="button" onClick={() => submitVariant(product.id)}>SKU 추가</button>

                        <h3>재고 현황</h3>
                        {productVariants.length === 0 ? <p>등록된 SKU가 없어.</p> : productVariants.map((variant) => (
                            <div key={variant.id}>
                                <strong>{variant.skuCode}</strong>
                                <p>
                                    {variant.optionName1 ? `${variant.optionName1}: ${variant.optionValue1}` : '기본 옵션'}
                                    {variant.optionName2 ? ` / ${variant.optionName2}: ${variant.optionValue2}` : ''}
                                </p>
                                <p>실재고: {variant.onHandQuantity}</p>
                                <p>예약재고: {variant.reservedQuantity}</p>
                                <p>안전재고: {variant.safetyStockQuantity}</p>
                                <p><b>판매가능재고: {variant.availableQuantity}</b></p>
                                <p>누적판매: {variant.soldQuantity}</p>
                                <button onClick={async () => {
                                    const value = prompt('추가 입고 수량을 입력해줘.')
                                    if (!value) return
                                    await restockVariant(variant.id, Number(value))
                                    await load()
                                }}>입고</button>
                                <button onClick={async () => {
                                    const value = prompt('새 안전재고 수량을 입력해줘.', variant.safetyStockQuantity)
                                    if (value === null) return
                                    await updateSafetyStock(variant.id, Number(value))
                                    await load()
                                }}>안전재고 변경</button>
                                <hr />
                            </div>
                        ))}
                    </section>
                )
            })}
        </div>
    )
}

export default ProductManagePage
